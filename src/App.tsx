import React, { useState, useMemo, useRef, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import {
  INITIAL_CART,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS
} from './data/aquaticCatalog';
import { NCM_PARTNER_INFO, NCM_PORTAL_RATES } from './data/ncmDeliveryRates';
import { auth, googleProvider } from './firebase';
import {
  ActiveGoogleAccount,
  ensureUserProfileSynced,
  saveCustomProductToCloud,
  saveOrderToCloud,
  signInKeylessGoogleViaBackend,
  subscribeUserCloudOrders,
  subscribeUserCustomProducts,
  verifyBackendAuthSession,
  verifyKeylessBackendSession
} from './services/cloudSync';
import {
  ActiveTab,
  CartItem,
  CatalogCollection,
  CatalogFilterState,
  FulfillmentMode,
  GatewayPaymentProof,
  GatewayProvider,
  NcmDeliveryType,
  OrderDeliveryInfo,
  OrderRecord,
  PaymentMethod,
  Product
} from './types/pos';
import {
  addItemToCart,
  calculateOrderTotals,
  calculateRevenueStats,
  deductProductStock,
  filterCatalogProducts,
  findNcmBranchRate,
  formatNPR,
  getQuickCashAmounts,
  removeItemFromCart,
  resolveNcmDeliveryFee,
  syncUpdatedProductInCart,
  updateCatalogProduct,
  updateItemQuantityInCart
} from './utils/posLogic';
import { Header } from './components/Header';
import { StorefrontHero } from './components/StorefrontHero';
import { CatalogSection } from './components/CatalogSection';
import { OrderSidebar } from './components/OrderSidebar';
import { PaymentSection } from './components/PaymentSection';
import { InventoryView } from './components/InventoryView';
import { OrderHistoryView } from './components/OrderHistoryView';
import { AddProductModal } from './components/AddProductModal';
import { CustomizeCardModal } from './components/CustomizeCardModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { ReceiptModal } from './components/ReceiptModal';
import { GatewayCheckoutModal } from './components/GatewayCheckoutModal';
import { NcmRateModal } from './components/NcmRateModal';
import { StoreFooter } from './components/StoreFooter';

const CATALOG_STORAGE_KEY = 'aquanest_catalog_products_v1';
const ORDERS_STORAGE_KEY = 'aquanest_orders_v2';
const KEYLESS_AUTH_STORAGE_KEY = 'aquanest_keyless_google_session_v1';

function loadInitialProducts(): Product[] {
  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return INITIAL_PRODUCTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as Product[];
    }
  } catch {
    // Fall back to default catalog on parse or storage access errors
  }
  return INITIAL_PRODUCTS;
}

function loadInitialOrders(): OrderRecord[] {
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return INITIAL_ORDERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as OrderRecord[];
    }
  } catch {
    // Fall back to initial orders
  }
  return INITIAL_ORDERS;
}

function loadSavedKeylessAccount(): ActiveGoogleAccount | null {
  try {
    const raw = window.localStorage.getItem(KEYLESS_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveGoogleAccount;
    if (parsed && parsed.email && parsed.displayName) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

const DEFAULT_FILTERS: CatalogFilterState = {
  department: 'All',
  subcategory: 'All',
  brand: 'All Brands',
  collection: 'all',
  searchQuery: ''
};

export default function App() {
  // --- Navigation & Store State ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [storeName, setStoreName] = useState('Aqua Nest');
  const [products, setProducts] = useState<Product[]>(() => loadInitialProducts());
  const [orders, setOrders] = useState<OrderRecord[]>(() => loadInitialOrders());

  // --- Nature Aquatics Menu & Product Filtering State ---
  const [filters, setFilters] = useState<CatalogFilterState>(DEFAULT_FILTERS);
  const [selectedPortions, setSelectedPortions] = useState<Record<string, number>>({});

  // --- Add / Customize Card & Google Auth Modals ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // --- Google Authentication (Firebase + Keyless Backend) State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [keylessAccount, setKeylessAccount] = useState<ActiveGoogleAccount | null>(() =>
    loadSavedKeylessAccount()
  );
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [backendVerified, setBackendVerified] = useState(false);
  const [syncedCardsCount, setSyncedCardsCount] = useState(0);
  const [syncedOrdersCount, setSyncedOrdersCount] = useState(0);

  const activeAccount = useMemo<ActiveGoogleAccount | null>(() => {
    if (currentUser) {
      return {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Aqua Nest User',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || '',
        mode: 'firebase'
      };
    }
    return keylessAccount;
  }, [currentUser, keylessAccount]);

  // --- Current Order / Cart State ---
  const [cart, setCart] = useState<CartItem[]>(() => {
    let synced = INITIAL_CART;
    for (const prod of products) {
      synced = syncUpdatedProductInCart(synced, prod);
    }
    return synced;
  });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [showCustomerFields, setShowCustomerFields] = useState(false);

  // --- Nepal Can Move (NCM) Delivery & Fulfillment State ---
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>('ncm');
  const [ncmDestination, setNcmDestination] = useState<string>('TINKUNE');
  const [ncmDeliveryType, setNcmDeliveryType] = useState<NcmDeliveryType>('home');
  const [ncmAddress, setNcmAddress] = useState<string>('');
  const [isNcmRateModalOpen, setIsNcmRateModalOpen] = useState(false);

  // --- Checkout & Bottom Payment Section State ---
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('esewa');
  const [gatewayProofs, setGatewayProofs] = useState<
    Partial<Record<GatewayProvider, GatewayPaymentProof>>
  >({});
  const [activeGatewayModal, setActiveGatewayModal] = useState<GatewayProvider | null>(null);
  const [cashTendered, setCashTendered] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  const [cardTerminalVerified, setCardTerminalVerified] = useState(true);
  const [qrVerified, setQrVerified] = useState(true);
  const [bankRefNumber, setBankRefNumber] = useState('');

  // --- Receipt Modal & Toast Notification ---
  const [activeReceipt, setActiveReceipt] = useState<OrderRecord | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );
  const [historySearch, setHistorySearch] = useState('');

  const paymentSectionRef = useRef<HTMLElement | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(products));
    } catch {
      // Ignore localStorage quota exceeded errors if many high-res custom photos are uploaded
    }
  }, [products]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // Ignore storage quota errors
    }
  }, [orders]);

  // --- Listen to Firebase Google Auth State & Verify Keyless Session ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
      if (!user) {
        setSyncedCardsCount(0);
        setSyncedOrdersCount(0);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!keylessAccount?.token || currentUser) return;
    let active = true;
    void verifyKeylessBackendSession(keylessAccount.token).then((ok) => {
      if (active) setBackendVerified(ok);
    });
    return () => {
      active = false;
    };
  }, [keylessAccount, currentUser]);

  // --- Attach Firestore Listeners Only When Auth is Ready & User is Authenticated ---
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    let cancelled = false;
    let unsubProducts: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;

    void (async () => {
      await ensureUserProfileSynced(currentUser, storeName);
      if (cancelled) return;

      const verified = await verifyBackendAuthSession(currentUser);
      if (!cancelled) {
        setBackendVerified(verified);
      }

      unsubProducts = subscribeUserCustomProducts(currentUser.uid, (patches) => {
        if (cancelled) return;
        const activePatches = patches.filter((p) => !p.isDeleted);
        setSyncedCardsCount(activePatches.length);

        setProducts((prev) => {
          const deletedIds = new Set(patches.filter((p) => p.isDeleted).map((p) => p.id));
          const patchMap = new Map(activePatches.map((p) => [p.id, p.product]));
          const existingIds = new Set(prev.map((p) => p.id));

          const merged = prev
            .filter((p) => !deletedIds.has(p.id))
            .map((p) => {
              const cloudProd = patchMap.get(p.id);
              if (!cloudProd) return p;
              return {
                ...p,
                ...cloudProd,
                image: cloudProd.image || p.image
              };
            });

          const brandNewFromCloud = activePatches
            .filter((p) => !existingIds.has(p.id))
            .map((p) => p.product);

          return [...brandNewFromCloud, ...merged];
        });

        setCart((prevCart) => {
          let nextCart = prevCart;
          for (const patch of activePatches) {
            nextCart = syncUpdatedProductInCart(nextCart, patch.product);
          }
          return nextCart;
        });
      });

      unsubOrders = subscribeUserCloudOrders(currentUser.uid, (count) => {
        if (!cancelled) {
          setSyncedOrdersCount(count);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (unsubProducts) unsubProducts();
      if (unsubOrders) unsubOrders();
    };
  }, [isAuthReady, currentUser]);

  const handleSignInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    showToast(`Signed in as ${result.user.displayName || result.user.email || 'Google User'}`);
  };

  const handleSignInKeylessGoogle = async (displayName: string, email: string) => {
    const account = await signInKeylessGoogleViaBackend(displayName, email);
    setKeylessAccount(account);
    setBackendVerified(true);
    try {
      window.localStorage.setItem(KEYLESS_AUTH_STORAGE_KEY, JSON.stringify(account));
    } catch {
      // Ignore storage errors
    }
    showToast(`Signed in as ${account.displayName}`);
  };

  const handleSignOut = async () => {
    if (currentUser) {
      await signOut(auth);
    }
    setKeylessAccount(null);
    setBackendVerified(false);
    try {
      window.localStorage.removeItem(KEYLESS_AUTH_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    showToast('Signed out of account', 'info');
  };

  // --- Filtered Catalog Products ---
  const filteredProducts = useMemo(
    () => filterCatalogProducts(products, filters),
    [products, filters]
  );

  const handleUpdateFilters = (patch: Partial<CatalogFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const scrollToCatalog = () => {
    setTimeout(() => {
      document.getElementById('store-catalog-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 60);
  };

  const handleSelectMenuOption = (
    department: string,
    collection: CatalogCollection = 'all',
    subcategory = 'All'
  ) => {
    setActiveTab('pos');
    setFilters((prev) => ({
      ...prev,
      department,
      subcategory,
      collection
    }));
    if (department !== 'All' || collection !== 'all') {
      scrollToCatalog();
    }
  };

  // --- Live Nepal Can Move (NCM) Rate & Order Calculations ---
  const selectedNcmBranch = useMemo(
    () => findNcmBranchRate(NCM_PORTAL_RATES, ncmDestination),
    [ncmDestination]
  );

  const activeDeliveryFee = useMemo(
    () => resolveNcmDeliveryFee(fulfillmentMode, selectedNcmBranch, ncmDeliveryType),
    [fulfillmentMode, selectedNcmBranch, ncmDeliveryType]
  );

  const orderTotals = useMemo(
    () => calculateOrderTotals(cart, activeDeliveryFee),
    [cart, activeDeliveryFee]
  );

  const deliverySummaryLabel =
    fulfillmentMode === 'ncm'
      ? `Nepal Can Move (${ncmDestination} · ${formatNPR(orderTotals.deliveryFee)})`
      : 'Studio Pickup (Rs. 0.00)';

  const cashNumeric = parseFloat(cashTendered) || 0;
  const cashChangeDue = cashNumeric - orderTotals.total;
  const isCashSufficient = cashNumeric >= orderTotals.total - 0.005;

  useEffect(() => {
    if (isCheckoutOpen && cashTendered === '') {
      setCashTendered(orderTotals.total.toFixed(2));
    }
  }, [isCheckoutOpen, orderTotals.total, cashTendered]);

  useEffect(() => {
    setGatewayProofs({});
  }, [orderTotals.total]);

  const quickCashAmounts = useMemo(
    () => getQuickCashAmounts(orderTotals.total),
    [orderTotals.total]
  );

  // --- Cart Manipulation Handlers ---
  const handleSelectPortion = (productId: string, optionIdx: number) => {
    setSelectedPortions((prev) => ({ ...prev, [productId]: optionIdx }));
  };

  const handleAddToCart = (product: Product, optionIdx = 0) => {
    setCart((prev) => addItemToCart(prev, product, optionIdx));
  };

  const handleUpdateCartQuantity = (cartKey: string, delta: number) => {
    setCart((prev) => updateItemQuantityInCart(prev, cartKey, delta));
  };

  const handleRemoveFromCart = (cartKey: string) => {
    setCart((prev) => removeItemFromCart(prev, cartKey));
  };

  const handleClearOrder = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNote('');
    setNcmAddress('');
    setIsCheckoutOpen(false);
    setGatewayProofs({});
    setCashTendered('');
    setCardLastFour('');
    setBankRefNumber('');
    showToast('Order cleared and ready for next customer', 'info');
  };

  const handleSelectNcmRateFromModal = (destination: string, deliveryType: NcmDeliveryType) => {
    setFulfillmentMode('ncm');
    setNcmDestination(destination);
    setNcmDeliveryType(deliveryType);
    const branch = findNcmBranchRate(NCM_PORTAL_RATES, destination);
    const fee = branch
      ? deliveryType === 'home'
        ? branch.homeDeliveryFee
        : branch.officeDeliveryFee
      : 0;
    showToast(
      `NCM ${destination} (${deliveryType === 'home' ? 'Home' : 'Office'}) delivery set to ${formatNPR(fee)}`,
      'info'
    );
  };

  const handleGatewayPaymentSuccess = (proof: GatewayPaymentProof) => {
    setGatewayProofs((prev) => ({ ...prev, [proof.provider]: proof }));
    const label = proof.provider === 'esewa' ? 'eSewa' : 'Khalti';
    showToast(`${label} payment verified (${proof.transactionId})`);
  };

  const handleQuickVerifyGatewayQr = (provider: GatewayProvider) => {
    const prefix = provider === 'esewa' ? 'ESW-QR' : 'KHL-QR';
    const randomRef = Math.floor(100000 + Math.random() * 900000);
    const verifiedAt = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    const proof: GatewayPaymentProof = {
      provider,
      transactionId: `${prefix}-${randomRef}`,
      payerAccount: 'Counter QR Scan',
      amountNPR: Number(orderTotals.total.toFixed(2)),
      amountPaisa: Math.round(orderTotals.total * 100),
      verifiedAt,
      mode: 'qr'
    };
    setGatewayProofs((prev) => ({ ...prev, [provider]: proof }));
    showToast(
      `${provider === 'esewa' ? 'eSewa' : 'Khalti'} QR payment verified (${proof.transactionId})`
    );
  };

  // --- Create / Customize / Delete Product Cards ---
  const handleCreateProduct = (newProduct: Product, addDirectlyToOrder: boolean) => {
    setProducts((prev) => [newProduct, ...prev]);
    if (addDirectlyToOrder) {
      setCart((prev) => addItemToCart(prev, newProduct, 0));
    }
    if (currentUser) {
      void saveCustomProductToCloud(currentUser.uid, newProduct, false);
    }
    showToast(
      addDirectlyToOrder
        ? `"${newProduct.name}" added to catalog & active order`
        : `"${newProduct.name}" saved to store catalog`
    );
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) => updateCatalogProduct(prev, updatedProduct));
    setCart((prev) => syncUpdatedProductInCart(prev, updatedProduct));
    if (currentUser) {
      void saveCustomProductToCloud(currentUser.uid, updatedProduct, false);
    }
    showToast(`Updated "${updatedProduct.name}" (${formatNPR(updatedProduct.price)})`);
  };

  const handleDeleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (currentUser && target) {
      void saveCustomProductToCloud(currentUser.uid, target, true);
    }
    showToast('Item removed from store catalog', 'info');
  };

  // --- Checkout & Payment Confirmation ---
  const handleProceedToCheckout = () => {
    setActiveTab('pos');
    if (cart.length === 0) {
      document.getElementById('current-order-sidebar')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      showToast('Add at least one plant or item to checkout', 'error');
      return;
    }
    setIsCheckoutOpen(true);
    setCashTendered(orderTotals.total.toFixed(2));

    setTimeout(() => {
      paymentSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 80);
  };

  const handleConfirmPaymentAndGenerateOrder = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'esewa' || paymentMethod === 'khalti') {
      const proof = gatewayProofs[paymentMethod];
      if (!proof) {
        const label = paymentMethod === 'esewa' ? 'eSewa' : 'Khalti';
        showToast(
          `Please authorize ${label} via Gateway or Verify Counter QR Scan first`,
          'error'
        );
        return;
      }
    }
    if (paymentMethod === 'cash' && !isCashSufficient) {
      showToast('Cash tendered must cover the grand total', 'error');
      return;
    }
    if (paymentMethod === 'card' && !cardTerminalVerified) {
      showToast('Please confirm card terminal authorization', 'error');
      return;
    }
    if (paymentMethod === 'qr' && !qrVerified) {
      showToast('Please mark Fonepay QR payment as received', 'error');
      return;
    }

    const nextNumber = 1001 + orders.length;
    const orderId = `ORD-${nextNumber}`;
    const formattedTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    let methodLabel = 'Cash';
    let methodDetails = '';

    if (paymentMethod === 'esewa') {
      const proof = gatewayProofs.esewa!;
      methodLabel = 'eSewa Payment Gateway';
      methodDetails = `eSewa ePay v2 Verified · Ref ${proof.transactionId} · ${proof.payerAccount}`;
    } else if (paymentMethod === 'khalti') {
      const proof = gatewayProofs.khalti!;
      methodLabel = 'Khalti Payment Gateway';
      methodDetails = `Khalti KPG-2 Verified · Ref ${proof.transactionId} · ${proof.payerAccount}`;
    } else if (paymentMethod === 'cash') {
      methodLabel = 'Cash';
      methodDetails = `Tendered ${formatNPR(cashNumeric)} · Change ${formatNPR(Math.max(0, cashChangeDue))}`;
    } else if (paymentMethod === 'card') {
      methodLabel = 'Card Terminal';
      methodDetails = cardLastFour
        ? `Approved · Card ending in ${cardLastFour}`
        : 'Approved · Contactless / Chip';
    } else if (paymentMethod === 'qr') {
      methodLabel = 'Fonepay QR';
      methodDetails = `Fonepay Verified · Ref #FP-${Math.floor(10000 + Math.random() * 90000)}`;
    } else if (paymentMethod === 'bank') {
      methodLabel = 'Bank Transfer';
      methodDetails = bankRefNumber.trim()
        ? `ConnectIPS / Ref: ${bankRefNumber.trim()}`
        : 'Direct Deposit Verified';
    }

    const deliveryInfo: OrderDeliveryInfo =
      fulfillmentMode === 'ncm'
        ? {
            mode: 'ncm',
            partnerName: NCM_PARTNER_INFO.name,
            destination: ncmDestination,
            deliveryType: ncmDeliveryType,
            deliveryAddress: ncmAddress.trim() || undefined,
            fee: orderTotals.deliveryFee,
            trackingCode: `NCM-${Math.floor(100000 + Math.random() * 900000)}`
          }
        : {
            mode: 'pickup',
            partnerName: 'Studio Counter Pickup',
            fee: 0
          };

    const completedOrder: OrderRecord = {
      id: orderId,
      timestamp: `Today, ${formattedTime}`,
      customerName: customerName.trim() || 'Walk-in Aquascaper',
      customerPhone: customerPhone.trim(),
      orderNote: orderNote.trim(),
      items: [...cart],
      subtotal: orderTotals.subtotal,
      deliveryFee: orderTotals.deliveryFee,
      deliveryInfo,
      total: orderTotals.total,
      paymentMethod: methodLabel,
      paymentDetails: methodDetails,
      status: 'Paid'
    };

    setProducts((prev) => deductProductStock(prev, cart));
    setOrders((prev) => [completedOrder, ...prev]);
    setActiveReceipt(completedOrder);
    if (currentUser) {
      void saveOrderToCloud(currentUser.uid, completedOrder);
    }

    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNote('');
    setNcmAddress('');
    setIsCheckoutOpen(false);
    setGatewayProofs({});
    setCashTendered('');
    setCardLastFour('');
    setBankRefNumber('');

    showToast(`Order ${orderId} generated & payment confirmed!`);
  };

  // --- History Stats & Filtering ---
  const revenueStats = useMemo(() => calculateRevenueStats(orders), [orders]);

  const filteredOrders = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.paymentMethod.toLowerCase().includes(q) ||
        (o.deliveryInfo?.destination?.toLowerCase().includes(q) ?? false) ||
        (o.deliveryInfo?.trackingCode?.toLowerCase().includes(q) ?? false)
    );
  }, [orders, historySearch]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Non-blocking Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex items-center justify-between sm:justify-start gap-2.5 px-4 py-3 rounded-xl shadow-lg border bg-slate-900 text-white border-slate-700"
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white ml-1"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Header
        storeName={storeName}
        activeTab={activeTab}
        activeDepartment={filters.department}
        activeCollection={filters.collection}
        cartItemCount={orderTotals.itemCount}
        cartTotal={orderTotals.total}
        user={activeAccount}
        isAuthReady={isAuthReady}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSelectMenuOption={(dept, collection) => handleSelectMenuOption(dept, collection)}
        onOpenOrderCart={handleProceedToCheckout}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 flex-1">
        <StorefrontHero
          activeTab={activeTab}
          onTabChange={setActiveTab}
          productsCount={products.length}
          ordersCount={orders.length}
          onOpenAddModal={() => setIsProductModalOpen(true)}
          onOpenNcmRateModal={() => setIsNcmRateModalOpen(true)}
          onExploreDepartment={(dept, collection) => handleSelectMenuOption(dept, collection)}
        />

        {activeTab === 'pos' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <CatalogSection
                products={filteredProducts}
                totalCatalogCount={products.length}
                filters={filters}
                onUpdateFilters={handleUpdateFilters}
                onResetFilters={handleResetFilters}
                selectedPortions={selectedPortions}
                onSelectPortion={handleSelectPortion}
                cart={cart}
                onAddToCart={handleAddToCart}
                onEditProduct={(prod) => setEditingProduct(prod)}
                onOpenAddModal={() => setIsProductModalOpen(true)}
              />

              <OrderSidebar
                cart={cart}
                orderTotals={orderTotals}
                customerName={customerName}
                onCustomerNameChange={setCustomerName}
                customerPhone={customerPhone}
                onCustomerPhoneChange={setCustomerPhone}
                orderNote={orderNote}
                onOrderNoteChange={setOrderNote}
                showCustomerFields={showCustomerFields}
                onToggleCustomerFields={() => setShowCustomerFields(!showCustomerFields)}
                fulfillmentMode={fulfillmentMode}
                onFulfillmentModeChange={setFulfillmentMode}
                ncmDestination={ncmDestination}
                onNcmDestinationChange={setNcmDestination}
                ncmDeliveryType={ncmDeliveryType}
                onNcmDeliveryTypeChange={setNcmDeliveryType}
                ncmAddress={ncmAddress}
                onNcmAddressChange={setNcmAddress}
                selectedNcmBranch={selectedNcmBranch}
                onOpenNcmRateModal={() => setIsNcmRateModalOpen(true)}
                isCheckoutOpen={isCheckoutOpen}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveFromCart}
                onClearOrder={handleClearOrder}
                onProceedToCheckout={handleProceedToCheckout}
              />
            </div>

            {isCheckoutOpen && cart.length > 0 && (
              <PaymentSection
                sectionRef={paymentSectionRef}
                storeName={storeName}
                orderTotals={orderTotals}
                deliverySummaryLabel={deliverySummaryLabel}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                gatewayProofs={gatewayProofs}
                onOpenGatewayModal={(provider) => setActiveGatewayModal(provider)}
                onQuickVerifyGatewayQr={handleQuickVerifyGatewayQr}
                cashTendered={cashTendered}
                onCashTenderedChange={setCashTendered}
                quickCashAmounts={quickCashAmounts}
                isCashSufficient={isCashSufficient}
                cashChangeDue={cashChangeDue}
                cardLastFour={cardLastFour}
                onCardLastFourChange={setCardLastFour}
                cardTerminalVerified={cardTerminalVerified}
                onToggleCardVerified={() => setCardTerminalVerified(!cardTerminalVerified)}
                qrVerified={qrVerified}
                onToggleQrVerified={() => setQrVerified(!qrVerified)}
                bankRefNumber={bankRefNumber}
                onBankRefNumberChange={setBankRefNumber}
                onCloseCheckout={() => setIsCheckoutOpen(false)}
                onConfirmPayment={handleConfirmPaymentAndGenerateOrder}
              />
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            storeName={storeName}
            onStoreNameChange={setStoreName}
            products={products}
            onOpenAddModal={() => setIsProductModalOpen(true)}
            onQuickOrderProduct={(prod) => {
              handleAddToCart(prod, 0);
              setActiveTab('pos');
              showToast(`Added "${prod.name}" to active order`);
            }}
            onEditProduct={(prod) => setEditingProduct(prod)}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'history' && (
          <OrderHistoryView
            orders={filteredOrders}
            revenueStats={revenueStats}
            historySearch={historySearch}
            onHistorySearchChange={setHistorySearch}
            onViewReceipt={setActiveReceipt}
          />
        )}
      </main>

      <StoreFooter
        storeName={storeName}
        onSelectDepartment={(dept, sub = 'All', collection = 'all') =>
          handleSelectMenuOption(dept, collection, sub)
        }
        onSelectBrand={(brand) => {
          setActiveTab('pos');
          setFilters((prev) => ({ ...prev, brand }));
          scrollToCatalog();
        }}
        onOpenNcmRateModal={() => setIsNcmRateModalOpen(true)}
      />

      <NcmRateModal
        isOpen={isNcmRateModalOpen}
        selectedDestination={ncmDestination}
        selectedDeliveryType={ncmDeliveryType}
        fulfillmentMode={fulfillmentMode}
        onSelectRate={handleSelectNcmRateFromModal}
        onClose={() => setIsNcmRateModalOpen(false)}
      />

      <AddProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onCreateProduct={handleCreateProduct}
      />

      <CustomizeCardModal
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSaveProduct={handleUpdateProduct}
      />

      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        user={activeAccount}
        isAuthReady={isAuthReady}
        backendVerified={backendVerified}
        syncedCardsCount={syncedCardsCount}
        syncedOrdersCount={syncedOrdersCount}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignInKeylessGoogle={handleSignInKeylessGoogle}
        onSignOut={handleSignOut}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <GatewayCheckoutModal
        isOpen={activeGatewayModal !== null}
        provider={activeGatewayModal || 'esewa'}
        storeName={storeName}
        orderTotals={orderTotals}
        onClose={() => setActiveGatewayModal(null)}
        onPaymentSuccess={handleGatewayPaymentSuccess}
      />

      <ReceiptModal
        receipt={activeReceipt}
        storeName={storeName}
        onClose={() => setActiveReceipt(null)}
      />
    </div>
  );
}
