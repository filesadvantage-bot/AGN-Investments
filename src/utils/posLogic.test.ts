import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addItemToCart,
  buildEsewaGatewayPayload,
  buildKhaltiGatewayPayload,
  calculateOrderTotals,
  calculateRevenueStats,
  deductProductStock,
  filterCatalogProducts,
  filterNcmBranches,
  findNcmBranchRate,
  formatNPR,
  generateQRMatrix,
  getProductCartQuantity,
  getQuickCashAmounts,
  maskNepalMobile,
  resolveNcmDeliveryFee,
  resolvePortionPrice,
  syncUpdatedProductInCart,
  updateCatalogProduct,
  updateItemQuantityInCart,
  validateNepalWalletCredentials
} from './posLogic';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  SAMPLE_AQUATIC_PLANT_TEMPLATES
} from '../data/aquaticCatalog';
import { NCM_PARTNER_INFO, NCM_PORTAL_RATES } from '../data/ncmDeliveryRates';

test('formatNPR formats Nepali Rupees with Rs. prefix and South Asian comma grouping', () => {
  assert.equal(formatNPR(1650), 'Rs. 1,650.00');
  assert.equal(formatNPR(11469.5), 'Rs. 11,469.50');
  assert.equal(formatNPR(125000), 'Rs. 1,25,000.00');
});

test('all initial products and sample aquatic plant templates include real asset image paths', () => {
  for (const prod of INITIAL_PRODUCTS) {
    assert.ok(prod.image && prod.image.startsWith('/src/assets/images/'), `Missing image on ${prod.name}`);
  }
  for (const tpl of SAMPLE_AQUATIC_PLANT_TEMPLATES) {
    assert.ok(tpl.image && tpl.image.startsWith('/src/assets/images/'), `Missing image on ${tpl.name}`);
  }
});

test('resolvePortionPrice calculates base and tissue culture option prices in NPR cleanly', () => {
  const anubias = INITIAL_PRODUCTS[0];
  const base = resolvePortionPrice(anubias, 0);
  assert.equal(base.price, 1650);
  assert.equal(base.portionLabel, 'Potted Rhizome');

  const tissueCup = resolvePortionPrice(anubias, 1);
  assert.equal(tissueCup.price, 1900);
  assert.equal(tissueCup.portionLabel, '1-2-Grow! Tissue Cup');
});

test('addItemToCart preserves plant image, separates portion options, and aggregates identical portions', () => {
  const anubias = INITIAL_PRODUCTS[0];
  let cart = addItemToCart([], anubias, 0);
  cart = addItemToCart(cart, anubias, 0);
  cart = addItemToCart(cart, anubias, 2); // Lava Rock Mounted

  assert.equal(cart.length, 2);
  assert.equal(cart[0].quantity, 2);
  assert.equal(cart[0].image, anubias.image);
  assert.equal(cart[1].quantity, 1);
  assert.equal(cart[1].portionLabel, 'Lava Rock Mounted');
  assert.equal(getProductCartQuantity(cart, anubias.id), 3);
});

test('updateItemQuantityInCart removes item when quantity drops to zero', () => {
  const monteCarlo = INITIAL_PRODUCTS[3];
  let cart = addItemToCart([], monteCarlo, 0);
  cart = updateItemQuantityInCart(cart, cart[0].cartKey, -1);
  assert.equal(cart.length, 0);
});

test('calculateOrderTotals computes NPR subtotal and optional NCM delivery fee without discount or tax', () => {
  const anubias = INITIAL_PRODUCTS[0]; // Rs. 1,650
  const monteCarlo = INITIAL_PRODUCTS[3]; // Rs. 1,400
  let cart = addItemToCart([], anubias, 0);
  cart = addItemToCart(cart, monteCarlo, 0);
  cart = updateItemQuantityInCart(cart, cart[1].cartKey, 1); // 2x 1400 = 2800 -> subtotal Rs. 4,450

  const totals = calculateOrderTotals(cart);
  assert.equal(Number(totals.subtotal.toFixed(2)), 4450);
  assert.equal(totals.deliveryFee, 0);
  assert.equal(Number(totals.total.toFixed(2)), 4450);
  assert.equal(totals.itemCount, 3);

  // With Nepal Can Move Tinkune Home Delivery (Rs. 170.00)
  const withNcm = calculateOrderTotals(cart, 170);
  assert.equal(withNcm.deliveryFee, 170);
  assert.equal(Number(withNcm.total.toFixed(2)), 4620);
});

test('Nepal Can Move (NCM Portal 4) rates match reference schedule for Home and Office delivery', () => {
  assert.equal(
    NCM_PARTNER_INFO.rateSheetUrl,
    'https://www.scribd.com/document/822275053/NCM-Portal-4'
  );

  const tinkune = findNcmBranchRate(NCM_PORTAL_RATES, 'TINKUNE');
  assert.ok(tinkune);
  assert.equal(resolveNcmDeliveryFee('ncm', tinkune, 'home'), 170);
  assert.equal(resolveNcmDeliveryFee('ncm', tinkune, 'office'), 120);
  assert.equal(resolveNcmDeliveryFee('pickup', tinkune, 'home'), 0);

  const chitwan = findNcmBranchRate(NCM_PORTAL_RATES, 'CHITWAN');
  assert.ok(chitwan);
  assert.equal(resolveNcmDeliveryFee('ncm', chitwan, 'home'), 120);
  assert.equal(resolveNcmDeliveryFee('ncm', chitwan, 'office'), 70);

  const lukla = findNcmBranchRate(NCM_PORTAL_RATES, 'LUKLA');
  assert.ok(lukla);
  assert.equal(resolveNcmDeliveryFee('ncm', lukla, 'home'), 320);
  assert.equal(resolveNcmDeliveryFee('ncm', lukla, 'office'), 270);

  const filtered = filterNcmBranches(NCM_PORTAL_RATES, 'All Regions', 'pokhara');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].homeDeliveryFee, 170);
  assert.equal(filtered[0].officeDeliveryFee, 120);
});

test('buildEsewaGatewayPayload and buildKhaltiGatewayPayload compute NPR, NCM delivery, and Paisa breakdowns accurately', () => {
  const totals = {
    subtotal: 4450,
    deliveryFee: 170,
    total: 4620,
    itemCount: 3
  };
  const esewa = buildEsewaGatewayPayload(totals);
  assert.equal(esewa.itemsSubtotal, 4450);
  assert.equal(esewa.deliveryCharge, 170);
  assert.equal(esewa.totalAmount, 4620);

  const khalti = buildKhaltiGatewayPayload(totals, 'Aqua Nest');
  assert.equal(khalti.amountNPR, 4620);
  assert.equal(khalti.amountPaisa, 462000);
});

test('validateNepalWalletCredentials enforces valid Nepal mobile, MPIN, and OTP', () => {
  assert.equal(validateNepalWalletCredentials('esewa', '', '1234', '123456').valid, false);
  assert.equal(validateNepalWalletCredentials('khalti', '12345', '1234', '123456').valid, false);
  assert.equal(validateNepalWalletCredentials('esewa', '9806800001', '12', '123456').valid, false);
  assert.equal(validateNepalWalletCredentials('khalti', '9800000001', '1111', '987654').valid, true);
  assert.equal(maskNepalMobile('9806800001'), '9806****01');
});

test('deductProductStock aggregates stock reduction across multiple portion options of same plant', () => {
  const anubias = INITIAL_PRODUCTS[0]; // stock 28
  let cart = addItemToCart([], anubias, 0);
  cart = addItemToCart(cart, anubias, 1);
  cart = updateItemQuantityInCart(cart, cart[0].cartKey, 2); // 3 potted + 1 tissue = 4 units

  const updated = deductProductStock(INITIAL_PRODUCTS, cart);
  assert.equal(updated[0].stock, 24);
});

test('getQuickCashAmounts and QR matrix produce valid NPR note presets and deterministic outputs', () => {
  const presets = getQuickCashAmounts(4739.22);
  assert.equal(presets[0], 4739.22);
  assert.ok(presets.includes(4800) || presets.includes(5000));

  const qr1 = generateQRMatrix('Verdant|4739.22');
  const qr2 = generateQRMatrix('Verdant|4739.22');
  assert.equal(qr1.length, 21);
  assert.deepEqual(qr1, qr2);
});

test('filterCatalogProducts filters by Nature Aquatics departments, placement zones, brands, and sale items', () => {
  const foregroundPlants = filterCatalogProducts(INITIAL_PRODUCTS, {
    department: 'Plants by Placement',
    subcategory: 'Foreground',
    brand: 'All Brands',
    collection: 'all',
    searchQuery: ''
  });
  assert.ok(foregroundPlants.length >= 3);
  assert.ok(foregroundPlants.every((p) => p.placement === 'Foreground'));

  const saleItems = filterCatalogProducts(INITIAL_PRODUCTS, {
    department: 'All',
    subcategory: 'All',
    brand: 'All Brands',
    collection: 'sale',
    searchQuery: ''
  });
  assert.ok(saleItems.length >= 4);
  assert.ok(saleItems.every((p) => (p.originalPrice ?? 0) > p.price));

  const seachemItems = filterCatalogProducts(INITIAL_PRODUCTS, {
    department: 'Water Treatment',
    subcategory: 'All',
    brand: 'Seachem',
    collection: 'all',
    searchQuery: ''
  });
  assert.equal(seachemItems.length, 1);
  assert.ok(seachemItems[0].name.includes('Seachem'));
});

test('calculateRevenueStats computes NPR revenue and average order value', () => {
  const stats = calculateRevenueStats(INITIAL_ORDERS);
  assert.equal(stats.totalOrders, 2);
  assert.equal(Number(stats.totalRevenue.toFixed(2)), 14810);
  assert.equal(Number(stats.avgOrder.toFixed(2)), 7405);
});

test('updateCatalogProduct and syncUpdatedProductInCart apply custom card image, details, and NPR price to catalog and active cart', () => {
  const original = INITIAL_PRODUCTS[0];
  let cart = addItemToCart([], original, 0); // Potted Rhizome @ Rs. 1,650
  cart = addItemToCart(cart, original, 1); // 1-2-Grow! Tissue Cup @ Rs. 1,900

  const customized = {
    ...original,
    name: 'Custom Aqua Nest Anubias XL',
    careNote: 'Custom mother clump mounted on volcanic lava stone',
    price: 2100,
    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    portionOptions: [
      { label: 'Potted Rhizome', priceDelta: 0 },
      { label: '1-2-Grow! Tissue Cup', priceDelta: 300 }
    ]
  };

  const updatedCatalog = updateCatalogProduct(INITIAL_PRODUCTS, customized);
  assert.equal(updatedCatalog[0].name, 'Custom Aqua Nest Anubias XL');
  assert.equal(updatedCatalog[0].careNote, 'Custom mother clump mounted on volcanic lava stone');
  assert.equal(updatedCatalog[0].price, 2100);
  assert.equal(updatedCatalog[0].image, customized.image);

  const syncedCart = syncUpdatedProductInCart(cart, customized);
  assert.equal(syncedCart.length, 2);
  assert.equal(syncedCart[0].name, 'Custom Aqua Nest Anubias XL');
  assert.equal(syncedCart[0].price, 2100);
  assert.equal(syncedCart[0].image, customized.image);
  assert.equal(syncedCart[1].price, 2400);
});

