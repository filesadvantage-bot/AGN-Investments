import {
  CartItem,
  CatalogFilterState,
  FulfillmentMode,
  GatewayProvider,
  NcmBranchRate,
  NcmDeliveryType,
  OrderRecord,
  OrderTotals,
  Product
} from '../types/pos';

export function buildCartKey(productId: string, portionLabel?: string): string {
  return portionLabel ? `${productId}::${portionLabel}` : productId;
}

export function resolvePortionPrice(product: Product, selectedOptionIndex = 0): {
  price: number;
  portionLabel?: string;
} {
  if (!product.portionOptions || product.portionOptions.length === 0) {
    return { price: Number(product.price.toFixed(2)) };
  }
  const safeIndex =
    selectedOptionIndex >= 0 && selectedOptionIndex < product.portionOptions.length
      ? selectedOptionIndex
      : 0;
  const option = product.portionOptions[safeIndex];
  const calculated = Math.max(0, product.price + option.priceDelta);
  return {
    price: Number(calculated.toFixed(2)),
    portionLabel: option.label
  };
}

export function addItemToCart(
  cart: CartItem[],
  product: Product,
  selectedOptionIndex = 0
): CartItem[] {
  const { price, portionLabel } = resolvePortionPrice(product, selectedOptionIndex);
  const cartKey = buildCartKey(product.id, portionLabel);
  const existing = cart.find((item) => item.cartKey === cartKey);

  if (existing) {
    return cart.map((item) =>
      item.cartKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item
    );
  }

  return [
    ...cart,
    {
      cartKey,
      productId: product.id,
      name: product.name,
      portionLabel,
      price,
      quantity: 1,
      icon: product.icon || '🌿',
      image: product.image
    }
  ];
}

export function updateItemQuantityInCart(
  cart: CartItem[],
  cartKey: string,
  delta: number
): CartItem[] {
  return cart
    .map((item) =>
      item.cartKey === cartKey ? { ...item, quantity: item.quantity + delta } : item
    )
    .filter((item) => item.quantity > 0);
}

export function removeItemFromCart(cart: CartItem[], cartKey: string): CartItem[] {
  return cart.filter((item) => item.cartKey !== cartKey);
}

export function getProductCartQuantity(cart: CartItem[], productId: string): number {
  return cart
    .filter((item) => item.productId === productId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function updateCatalogProduct(
  products: Product[],
  updatedProduct: Product
): Product[] {
  return products.map((prod) => (prod.id === updatedProduct.id ? updatedProduct : prod));
}

export function syncUpdatedProductInCart(
  cart: CartItem[],
  updatedProduct: Product
): CartItem[] {
  const merged = new Map<string, CartItem>();

  for (const item of cart) {
    if (item.productId !== updatedProduct.id) {
      merged.set(item.cartKey, item);
      continue;
    }

    let nextPortionLabel: string | undefined;
    let nextPrice = Number(updatedProduct.price.toFixed(2));

    if (updatedProduct.portionOptions && updatedProduct.portionOptions.length > 0) {
      const matchedIdx = item.portionLabel
        ? updatedProduct.portionOptions.findIndex((opt) => opt.label === item.portionLabel)
        : 0;
      const resolved = resolvePortionPrice(
        updatedProduct,
        matchedIdx >= 0 ? matchedIdx : 0
      );
      nextPrice = resolved.price;
      nextPortionLabel = resolved.portionLabel;
    }

    const nextKey = buildCartKey(updatedProduct.id, nextPortionLabel);
    const existing = merged.get(nextKey);
    if (existing) {
      merged.set(nextKey, {
        ...existing,
        quantity: existing.quantity + item.quantity
      });
    } else {
      merged.set(nextKey, {
        ...item,
        cartKey: nextKey,
        name: updatedProduct.name,
        portionLabel: nextPortionLabel,
        price: nextPrice,
        icon: updatedProduct.icon || item.icon,
        image: updatedProduct.image
      });
    }
  }

  return Array.from(merged.values());
}

export function filterCatalogProducts(
  products: Product[],
  filters: CatalogFilterState
): Product[] {
  const q = filters.searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    // 1. Collection filter (New Arrivals / Best Selling / Items on Sale)
    if (filters.collection === 'new' && !product.isNewArrival) return false;
    if (filters.collection === 'bestseller' && !product.isBestSeller) return false;
    if (
      filters.collection === 'sale' &&
      !(product.originalPrice && product.originalPrice > product.price)
    ) {
      return false;
    }

    // 2. Brand filter
    if (
      filters.brand &&
      filters.brand !== 'All Brands' &&
      product.brand !== filters.brand
    ) {
      return false;
    }

    // 3. Department & Subcategory / Placement filter
    if (filters.department && filters.department !== 'All') {
      if (filters.department === 'Plants by Placement') {
        if (!product.placement) return false;
        if (
          filters.subcategory &&
          filters.subcategory !== 'All' &&
          product.placement !== filters.subcategory
        ) {
          return false;
        }
      } else {
        const prodDept = product.department || 'Custom';
        if (prodDept !== filters.department && product.category !== filters.department) {
          return false;
        }
        if (
          filters.subcategory &&
          filters.subcategory !== 'All' &&
          product.category !== filters.subcategory
        ) {
          return false;
        }
      }
    } else if (filters.subcategory && filters.subcategory !== 'All') {
      const matchesSub =
        product.category === filters.subcategory ||
        product.placement === filters.subcategory ||
        product.department === filters.subcategory;
      if (!matchesSub) return false;
    }

    // 4. Search query
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) ||
      Boolean(product.scientificName && product.scientificName.toLowerCase().includes(q)) ||
      Boolean(product.brand && product.brand.toLowerCase().includes(q)) ||
      Boolean(product.department && product.department.toLowerCase().includes(q)) ||
      product.category.toLowerCase().includes(q) ||
      Boolean(product.placement && product.placement.toLowerCase().includes(q)) ||
      Boolean(product.careNote && product.careNote.toLowerCase().includes(q)) ||
      product.sku.toLowerCase().includes(q)
    );
  });
}

export function findNcmBranchRate(
  rates: NcmBranchRate[],
  destination: string
): NcmBranchRate | undefined {
  const normalized = destination.trim().toUpperCase();
  return rates.find((r) => r.destination.toUpperCase() === normalized);
}

export function resolveNcmDeliveryFee(
  mode: FulfillmentMode,
  branch: NcmBranchRate | undefined,
  deliveryType: NcmDeliveryType
): number {
  if (mode !== 'ncm' || !branch) return 0;
  return deliveryType === 'home' ? branch.homeDeliveryFee : branch.officeDeliveryFee;
}

export function filterNcmBranches(
  rates: NcmBranchRate[],
  region: string,
  searchQuery: string
): NcmBranchRate[] {
  const q = searchQuery.trim().toLowerCase();
  return rates.filter((rate) => {
    if (region && region !== 'All Regions' && rate.region !== region) {
      return false;
    }
    if (!q) return true;
    return (
      rate.destination.toLowerCase().includes(q) ||
      rate.region.toLowerCase().includes(q) ||
      rate.fromHub.toLowerCase().includes(q) ||
      String(rate.sn) === q
    );
  });
}

export function calculateOrderTotals(
  cart: CartItem[],
  deliveryFee: number | string = 0
): OrderTotals {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const safeDeliveryFee = cart.length > 0 ? Math.max(0, Number(deliveryFee) || 0) : 0;
  const total = subtotal + safeDeliveryFee;
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return {
    subtotal,
    deliveryFee: safeDeliveryFee,
    total,
    itemCount
  };
}

export function formatNPR(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `Rs. ${safe.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function getQuickCashAmounts(total: number): number[] {
  const exact = Number(total.toFixed(2));
  if (exact <= 0) return [];
  const presets = new Set<number>([exact]);
  [100, 500, 1000, 2000, 5000].forEach((note) => {
    if (note >= exact) {
      presets.add(note);
    } else {
      presets.add(Math.ceil(exact / note) * note);
    }
  });
  return Array.from(presets)
    .filter((v) => v >= exact && v > 0)
    .sort((a, b) => a - b)
    .slice(0, 4);
}

export function deductProductStock(products: Product[], cart: CartItem[]): Product[] {
  return products.map((prod) => {
    const orderedQty = cart
      .filter((c) => c.productId === prod.id)
      .reduce((sum, c) => sum + c.quantity, 0);
    if (orderedQty === 0) return prod;
    return {
      ...prod,
      stock: Math.max(0, prod.stock - orderedQty)
    };
  });
}

export function calculateRevenueStats(orders: OrderRecord[]): {
  totalRevenue: number;
  totalOrders: number;
  avgOrder: number;
} {
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = orders.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  return { totalRevenue, totalOrders, avgOrder };
}

export function buildEsewaGatewayPayload(
  orderTotals: OrderTotals,
  merchantCode = 'EPAY-VERDANT-NP'
): {
  merchantCode: string;
  itemsSubtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  signedFieldNames: string;
} {
  const itemsSubtotal = Number(Math.max(0, orderTotals.subtotal).toFixed(2));
  const deliveryCharge = Number((orderTotals.deliveryFee || 0).toFixed(2));
  const totalAmount = Number((itemsSubtotal + deliveryCharge).toFixed(2));
  return {
    merchantCode,
    itemsSubtotal,
    deliveryCharge,
    totalAmount,
    signedFieldNames: 'total_amount,transaction_uuid,product_code'
  };
}

export function buildKhaltiGatewayPayload(
  orderTotals: OrderTotals,
  merchantName: string
): {
  merchantName: string;
  amountNPR: number;
  amountPaisa: number;
} {
  const amountNPR = Number(orderTotals.total.toFixed(2));
  const amountPaisa = Math.max(1000, Math.round(amountNPR * 100));
  return {
    merchantName,
    amountNPR,
    amountPaisa
  };
}

export function maskNepalMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 10) return digits || 'Wallet';
  return `${digits.slice(0, 4)}****${digits.slice(-2)}`;
}

export function validateNepalWalletCredentials(
  provider: GatewayProvider,
  mobile: string,
  mpin: string,
  otp: string
): { valid: boolean; error?: string } {
  const cleanMobile = mobile.replace(/\D/g, '');
  const label = provider === 'esewa' ? 'eSewa ID' : 'Khalti Mobile ID';
  if (!/^9[678]\d{8}$/.test(cleanMobile)) {
    return {
      valid: false,
      error: `Enter a valid 10-digit Nepal ${label} starting with 98, 97, or 96.`
    };
  }
  if (!/^\d{4,6}$/.test(mpin.trim())) {
    return {
      valid: false,
      error: 'Enter a valid 4 to 6 digit MPIN / Transaction PIN.'
    };
  }
  if (!/^\d{6}$/.test(otp.trim())) {
    return {
      valid: false,
      error: 'Enter the 6-digit confirmation OTP code.'
    };
  }
  return { valid: true };
}

export function generateQRMatrix(value: string): boolean[][] {
  const dim = 21;
  const matrix: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false));

  const drawFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startR + r][startC + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, dim - 7);
  drawFinder(dim - 7, 0);

  let seed = 2166136261;
  for (let i = 0; i < value.length; i++) {
    seed ^= value.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  for (let r = 0; r < dim; r++) {
    for (let c = 0; c < dim; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= dim - 8;
      const inBottomLeft = r >= dim - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      if (r === 6 || c === 6) {
        matrix[r][c] = (r + c) % 2 === 0;
        continue;
      }

      seed ^= r * 31 + c * 17 + seed;
      seed = Math.imul(seed, 1664525) + 1013904223;
      matrix[r][c] = (seed >>> 16) % 2 === 0;
    }
  }
  return matrix;
}
