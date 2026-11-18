import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Store,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  Receipt,
  History,
  Package,
  User,
  Phone,
  FileText,
  Percent,
  DollarSign,
  Printer,
  X,
  ArrowDown,
  Check,
  Clock,
  TrendingUp,
  Tag,
  RotateCcw,
  Sparkles
} from 'lucide-react';

// --- Initial Sample Store Catalog ---
const INITIAL_PRODUCTS = [
  { id: 'p-1', name: 'Artisan Espresso Beans (500g)', price: 18.50, category: 'Beverages', stock: 34, icon: '☕', sku: 'BEV-101' },
  { id: 'p-2', name: 'Organic Matcha Tin', price: 24.00, category: 'Beverages', stock: 18, icon: '🍵', sku: 'BEV-102' },
  { id: 'p-3', name: 'Cold Brew Bottle (350ml)', price: 5.75, category: 'Beverages', stock: 42, icon: '🧋', sku: 'BEV-103' },
  { id: 'p-4', name: 'Sourdough Country Loaf', price: 8.50, category: 'Bakery', stock: 15, icon: '🍞', sku: 'BAK-201' },
  { id: 'p-5', name: 'Almond Butter Croissant', price: 4.95, category: 'Bakery', stock: 22, icon: '🥐', sku: 'BAK-202' },
  { id: 'p-6', name: 'Blueberry Muffin Box (4pc)', price: 12.00, category: 'Bakery', stock: 12, icon: '🧁', sku: 'BAK-203' },
  { id: 'p-7', name: 'Ceramic Pour-Over Dripper', price: 32.00, category: 'Essentials', stock: 9, icon: '🏺', sku: 'ESS-301' },
  { id: 'p-8', name: 'Insulated Travel Tumbler', price: 28.50, category: 'Essentials', stock: 20, icon: '🥤', sku: 'ESS-302' },
  { id: 'p-9', name: 'Wildflower Raw Honey (400g)', price: 14.25, category: 'Pantry', stock: 27, icon: '🍯', sku: 'PAN-401' },
  { id: 'p-10', name: 'Sea Salt Dark Chocolate Bar', price: 6.50, category: 'Snacks', stock: 50, icon: '🍫', sku: 'SNK-501' },
  { id: 'p-11', name: 'Roasted Pistachio Pack', price: 9.75, category: 'Snacks', stock: 31, icon: '🥜', sku: 'SNK-502' },
  { id: 'p-12', name: 'Extra Virgin Olive Oil (750ml)', price: 22.00, category: 'Pantry', stock: 16, icon: '🫒', sku: 'PAN-402' },
];

// --- Initial Completed Orders for Demo History ---
const INITIAL_ORDERS = [
  {
    id: 'ORD-1001',
    timestamp: 'Today, 09:45 AM',
    customerName: 'Maya Lin',
    customerPhone: '555-0148',
    orderNote: 'Gift wrap tumbler please',
    items: [
      { id: 'p-1', name: 'Artisan Espresso Beans (500g)', price: 18.50, quantity: 1, icon: '☕' },
      { id: 'p-8', name: 'Insulated Travel Tumbler', price: 28.50, quantity: 1, icon: '🥤' }
    ],
    subtotal: 47.00,
    discountLabel: '$0.00',
    discountAmount: 0,
    taxRate: 8,
    taxAmount: 3.76,
    total: 50.76,
    paymentMethod: 'QR / Digital Wallet',
    paymentDetails: 'Wallet Ref #QR-88412',
    status: 'Paid'
  },
  {
    id: 'ORD-1002',
    timestamp: 'Today, 10:20 AM',
    customerName: 'Walk-in Customer',
    customerPhone: '',
    orderNote: '',
    items: [
      { id: 'p-4', name: 'Sourdough Country Loaf', price: 8.50, quantity: 2, icon: '🍞' },
      { id: 'p-5', name: 'Almond Butter Croissant', price: 4.95, quantity: 2, icon: '🥐' }
    ],
    subtotal: 26.90,
    discountLabel: '10%',
    discountAmount: 2.69,
    taxRate: 8,
    taxAmount: 1.94,
    total: 26.15,
    paymentMethod: 'Cash',
    paymentDetails: 'Tendered $30.00 • Change $3.85',
    status: 'Paid'
  }
];

const DEFAULT_CATEGORIES = ['All', 'Beverages', 'Bakery', 'Pantry', 'Snacks', 'Essentials', 'Custom'];
const ICON_OPTIONS = ['🛍️', '☕', '🥐', '🍫', '🍯', '🥤', '📦', '🎁', '🥗', '👕', '📱', '✨'];

// --- Deterministic SVG QR Code Generator Component ---
function DynamicQRCode({ value = 'STORE-ORDER', size = 168 }) {
  // Generate a crisp scannable-looking 21x21 QR matrix seeded from value string
  const grid = useMemo(() => {
    const dim = 21;
    const matrix = Array.from({ length: dim }, () => Array(dim).fill(false));

    // Helper to draw 7x7 finder patterns in 3 corners
    const drawFinder = (startR, startC) => {
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

    // Seed hash from string
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

        // Timing patterns
        if (r === 6 || c === 6) {
          matrix[r][c] = (r + c) % 2 === 0;
          continue;
        }

        seed ^= (r * 31 + c * 17) + seed;
        seed = Math.imul(seed, 1664525) + 1013904223;
        matrix[r][c] = (seed >>> 16) % 2 === 0;
      }
    }
    return matrix;
  }, [value]);

  const cellSize = size / 21;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-200 mx-auto"
      aria-label="Payment QR Code"
    >
      <rect width={size} height={size} fill="#ffffff" />
      {grid.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx * cellSize}
              y={rIdx * cellSize}
              width={cellSize + 0.35}
              height={cellSize + 0.35}
              rx={1.2}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function App() {
  // --- Navigation & Store State ---
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'inventory' | 'history'
  const [storeName, setStoreName] = useState('Nova Market & POS');
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  // --- Product Filtering ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- Custom Product Modal State ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Custom');
  const [newProdStock, setNewProdStock] = useState('25');
  const [newProdIcon, setNewProdIcon] = useState('🛍️');
  const [addDirectlyToOrder, setAddDirectlyToOrder] = useState(true);

  // --- Current Order / Cart State ---
  const [cart, setCart] = useState([
    { id: 'p-1', name: 'Artisan Espresso Beans (500g)', price: 18.50, quantity: 1, icon: '☕' },
    { id: 'p-5', name: 'Almond Butter Croissant', price: 4.95, quantity: 2, icon: '🥐' }
  ]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [showCustomerFields, setShowCustomerFields] = useState(false);

  // --- Tax & Discount Configuration ---
  const [taxRate, setTaxRate] = useState(8);
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState(0);

  // --- Checkout & Bottom Payment Section State ---
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'card' | 'qr' | 'bank'
  const [cashTendered, setCashTendered] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  const [cardTerminalVerified, setCardTerminalVerified] = useState(true);
  const [qrVerified, setQrVerified] = useState(true);
  const [bankRefNumber, setBankRefNumber] = useState('');

  // --- Receipt Modal & Toast Notification ---
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [toast, setToast] = useState(null);
  const [historySearch, setHistorySearch] = useState('');

  // Refs for smooth scrolling to the bottom payment section
  const paymentSectionRef = useRef(null);

  // Helper to trigger non-blocking toast notifications
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // --- Derived Categories & Filtered Catalog ---
  const categories = useMemo(() => {
    const dynamicCats = new Set(DEFAULT_CATEGORIES);
    products.forEach((p) => dynamicCats.add(p.category));
    return Array.from(dynamicCats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCat = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesQuery =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // --- Live Order Calculations ---
  const orderTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const parsedDiscount = Math.max(0, Number(discountValue) || 0);
    const rawDiscount =
      discountType === 'percent'
        ? subtotal * (Math.min(parsedDiscount, 100) / 100)
        : parsedDiscount;
    const discountAmount = Math.min(subtotal, rawDiscount);
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const parsedTax = Math.max(0, Number(taxRate) || 0);
    const taxAmount = taxableAmount * (parsedTax / 100);
    const total = taxableAmount + taxAmount;
    const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
      itemCount
    };
  }, [cart, discountType, discountValue, taxRate]);

  // --- Cash Change Calculation ---
  const cashNumeric = parseFloat(cashTendered) || 0;
  const cashChangeDue = cashNumeric - orderTotals.total;
  const isCashSufficient = cashNumeric >= orderTotals.total - 0.005;

  // Automatically prefill exact cash when opening checkout or when total updates if empty
  useEffect(() => {
    if (isCheckoutOpen && cashTendered === '') {
      setCashTendered(orderTotals.total.toFixed(2));
    }
  }, [isCheckoutOpen, orderTotals.total]);

  // --- Cart Manipulation Functions ---
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          icon: product.icon || '🛍️',
          quantity: 1
        }
      ];
    });
  };

  const updateCartQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCurrentOrder = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNote('');
    setDiscountValue(0);
    setIsCheckoutOpen(false);
    setCashTendered('');
    setCardLastFour('');
    setBankRefNumber('');
    showToast('Order cleared and ready for next customer', 'info');
  };

  // --- Add Custom Product / Item Handler ---
  const handleCreateCustomProduct = (e) => {
    e.preventDefault();
    const trimmedName = newProdName.trim();
    const parsedPrice = parseFloat(newProdPrice);
    const parsedStock = parseInt(newProdStock, 10);

    if (!trimmedName || isNaN(parsedPrice) || parsedPrice < 0) {
      showToast('Please enter a valid product name and price', 'error');
      return;
    }

    const newProduct = {
      id: `cust-${Date.now()}`,
      name: trimmedName,
      price: parsedPrice,
      category: newProdCategory || 'Custom',
      stock: isNaN(parsedStock) ? 20 : parsedStock,
      icon: newProdIcon,
      sku: `CUS-${Math.floor(100 + Math.random() * 900)}`
    };

    setProducts((prev) => [newProduct, ...prev]);
    if (addDirectlyToOrder) {
      addToCart(newProduct);
    }

    setNewProdName('');
    setNewProdPrice('');
    setNewProdCategory('Custom');
    setNewProdStock('25');
    setIsProductModalOpen(false);
    showToast(
      addDirectlyToOrder
        ? `"${newProduct.name}" added to catalog & order!`
        : `"${newProduct.name}" saved to store catalog!`
    );
  };

  const handleDeleteCatalogProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Product removed from catalog', 'info');
  };

  // --- Trigger Checkout & Smooth Scroll to Bottom Payment Section ---
  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      showToast('Add at least one item to generate an order', 'error');
      return;
    }
    setIsCheckoutOpen(true);
    setCashTendered(orderTotals.total.toFixed(2));

    // Allow DOM to render the revealed bottom payment section before scrolling smoothly
    setTimeout(() => {
      paymentSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 90);
  };

  // --- Finalize Payment & Generate Order ---
  const handleConfirmPaymentAndGenerateOrder = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'cash' && !isCashSufficient) {
      showToast('Cash tendered must cover the grand total', 'error');
      return;
    }
    if (paymentMethod === 'card' && !cardTerminalVerified) {
      showToast('Please confirm card terminal authorization', 'error');
      return;
    }
    if (paymentMethod === 'qr' && !qrVerified) {
      showToast('Please mark QR wallet payment as received', 'error');
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

    if (paymentMethod === 'cash') {
      methodLabel = 'Cash';
      methodDetails = `Tendered $${cashNumeric.toFixed(2)} • Change $${Math.max(0, cashChangeDue).toFixed(2)}`;
    } else if (paymentMethod === 'card') {
      methodLabel = 'Card Terminal';
      methodDetails = cardLastFour
        ? `Approved • Card ending in ${cardLastFour}`
        : 'Approved • Contactless / Chip';
    } else if (paymentMethod === 'qr') {
      methodLabel = 'QR / Digital Wallet';
      methodDetails = `Verified Scan • Ref #QR-${Math.floor(10000 + Math.random() * 90000)}`;
    } else if (paymentMethod === 'bank') {
      methodLabel = 'Bank Transfer';
      methodDetails = bankRefNumber.trim()
        ? `Transfer Ref: ${bankRefNumber.trim()}`
        : 'Direct Deposit Verified';
    }

    const completedOrder = {
      id: orderId,
      timestamp: `Today, ${formattedTime}`,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim(),
      orderNote: orderNote.trim(),
      items: [...cart],
      subtotal: orderTotals.subtotal,
      discountLabel:
        Number(discountValue) > 0
          ? discountType === 'percent'
            ? `${discountValue}%`
            : `$${Number(discountValue).toFixed(2)}`
          : '$0.00',
      discountAmount: orderTotals.discountAmount,
      taxRate: Number(taxRate) || 0,
      taxAmount: orderTotals.taxAmount,
      total: orderTotals.total,
      paymentMethod: methodLabel,
      paymentDetails: methodDetails,
      status: 'Paid'
    };

    // Deduct stock quantities
    setProducts((prev) =>
      prev.map((prod) => {
        const ordered = cart.find((c) => c.id === prod.id);
        if (!ordered) return prod;
        return { ...prod, stock: Math.max(0, prod.stock - ordered.quantity) };
      })
    );

    setOrders((prev) => [completedOrder, ...prev]);
    setActiveReceipt(completedOrder);

    // Reset active cart & checkout section
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNote('');
    setDiscountValue(0);
    setIsCheckoutOpen(false);
    setCashTendered('');
    setCardLastFour('');
    setBankRefNumber('');

    showToast(`Order ${orderId} generated & payment confirmed!`);
  };

  // --- History Revenue Summary ---
  const revenueStats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, avgOrder };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!historySearch.trim()) return orders;
    const q = historySearch.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.paymentMethod.toLowerCase().includes(q)
    );
  }, [orders, historySearch]);

  // Quick cash preset denominations based on current total
  const quickCashAmounts = useMemo(() => {
    const exact = Number(orderTotals.total.toFixed(2));
    const presets = new Set([exact]);
    [5, 10, 20, 50, 100].forEach((bill) => {
      if (bill >= exact) presets.add(bill);
      else presets.add(Math.ceil(exact / bill) * bill);
    });
    return Array.from(presets)
      .filter((v) => v >= exact && v > 0)
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [orderTotals.total]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Non-blocking Toast Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border bg-slate-900 text-white border-slate-700 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white ml-1"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                aria-label="Store Name"
                className="font-bold text-base sm:text-lg text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <p className="text-xs text-slate-500">Order Builder, Checkout & Payment Terminal</p>
            </div>
          </div>

          {/* Primary View Switcher */}
          <nav className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'pos'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Order & Checkout</span>
              {orderTotals.itemCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">
                  {orderTotals.itemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Products</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Orders</span>
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                {orders.length}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* ==================== TAB 1: POS ORDER & CHECKOUT ==================== */}
        {activeTab === 'pos' && (
          <div className="space-y-8">
            {/* Upper Split: Product Catalog (Left) + Order Builder & Summary (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT 7 COLUMNS: Product Catalog */}
              <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Store Catalog</h2>
                    <p className="text-xs text-slate-500">
                      Tap items to add to order or create custom store items
                    </p>
                  </div>
                  <button
                    onClick={() => setIsProductModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-colors border border-indigo-200/60"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Custom Product / Item</span>
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products by name or SKU..."
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Product Cards Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">No matching products found</p>
                    <button
                      onClick={() => setIsProductModalOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add as a custom item
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredProducts.map((product) => {
                      const inCartItem = cart.find((c) => c.id === product.id);
                      return (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className={`group relative text-left p-3.5 rounded-xl border transition-all hover:shadow-md active:scale-[0.99] flex flex-col justify-between ${
                            inCartItem
                              ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/30'
                              : 'border-slate-200 bg-white hover:border-indigo-300'
                          }`}
                        >
                          {inCartItem && (
                            <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                              {inCartItem.quantity}
                            </span>
                          )}
                          <div>
                            <div className="text-2xl mb-2">{product.icon || '🛍️'}</div>
                            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                              {product.category}
                            </span>
                            <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                              {product.name}
                            </h3>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-indigo-600">
                              ${product.price.toFixed(2)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {product.stock} in stock
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* RIGHT 5 COLUMNS: Current Order Builder & Checkout Summary */}
              <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h2 className="font-bold text-base">Current Order</h2>
                      <p className="text-xs text-slate-400">
                        {orderTotals.itemCount} {orderTotals.itemCount === 1 ? 'item' : 'items'} in
                        cart
                      </p>
                    </div>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCurrentOrder}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {/* Optional Customer Details Accordion */}
                <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setShowCustomerFields(!showCustomerFields)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      {customerName
                        ? `Customer: ${customerName}`
                        : 'Add Customer Info / Table / Order Note (Optional)'}
                    </span>
                    <span className="text-indigo-600">
                      {showCustomerFields ? 'Hide' : 'Edit'}
                    </span>
                  </button>

                  {showCustomerFields && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-2 border-t border-slate-200/70">
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Customer name"
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Phone or Table #"
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="sm:col-span-2 relative">
                        <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={orderNote}
                          onChange={(e) => setOrderNote(e.target.value)}
                          placeholder="Special instructions or order note..."
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart Line Items */}
                <div className="p-4 sm:p-5 max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <div className="py-10 text-center">
                      <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-500">Your order is empty</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Select products from the catalog to build an order
                      </p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              ${item.price.toFixed(2)} each
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                            <button
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-800 min-w-[22px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-sm font-bold text-slate-900 w-16 text-right">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Tax & Discount Controls + Live Totals */}
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-4">
                  {/* Discount & Tax Adjusters */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Discount
                      </label>
                      <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setDiscountType('percent')}
                          className={`px-2.5 text-xs font-bold transition-colors ${
                            discountType === 'percent'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('fixed')}
                          className={`px-2.5 text-xs font-bold transition-colors ${
                            discountType === 'fixed'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          $
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                        Tax Rate (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={taxRate}
                          onChange={(e) => setTaxRate(e.target.value)}
                          className="w-full pl-3 pr-7 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        />
                        <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* Subtotal / Discount / Tax / Grand Total */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/80 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-medium">${orderTotals.subtotal.toFixed(2)}</span>
                    </div>
                    {orderTotals.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span className="font-medium">
                          -${orderTotals.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Tax ({Number(taxRate) || 0}%)</span>
                      <span className="font-medium">${orderTotals.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-base font-bold text-slate-900">
                      <span>Grand Total</span>
                      <span className="text-xl text-indigo-600">
                        ${orderTotals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Prominent Checkout Action Button */}
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    disabled={cart.length === 0}
                    className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                      cart.length === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-[0.99]'
                    }`}
                  >
                    <span>
                      {isCheckoutOpen
                        ? 'Select Payment Option Below'
                        : `Checkout Order • $${orderTotals.total.toFixed(2)}`}
                    </span>
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                  </button>
                </div>
              </section>
            </div>

            {/* ==================== BOTTOM PAYMENT OPTIONS SECTION (REVEALED AFTER CHECKOUT) ==================== */}
            {isCheckoutOpen && cart.length > 0 && (
              <section
                ref={paymentSectionRef}
                className="bg-white rounded-2xl border-2 border-indigo-600/80 shadow-xl overflow-hidden scroll-mt-20 transition-all"
              >
                {/* Payment Section Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Step 2 • Checkout & Payment Options
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold">
                      Choose Payment Method to Complete Order
                    </h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-300">Amount Due</p>
                      <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                        ${orderTotals.total.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                      title="Collapse Payment Section"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-5 sm:p-8 space-y-6">
                  {/* Payment Method Selector Cards */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Select Payment Option
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      {[
                        {
                          id: 'cash',
                          title: 'Cash',
                          subtitle: 'Auto change calculator',
                          icon: Banknote
                        },
                        {
                          id: 'card',
                          title: 'Card Terminal',
                          subtitle: 'Credit / Debit / Tap',
                          icon: CreditCard
                        },
                        {
                          id: 'qr',
                          title: 'QR / Wallet',
                          subtitle: 'Scan & pay instant',
                          icon: QrCode
                        },
                        {
                          id: 'bank',
                          title: 'Bank Transfer',
                          subtitle: 'Direct wire / deposit',
                          icon: Building2
                        }
                      ].map((option) => {
                        const IconComp = option.icon;
                        const active = paymentMethod === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setPaymentMethod(option.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-2 ${
                              active
                                ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  active
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <IconComp className="w-5 h-5" />
                              </div>
                              {active && (
                                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900">{option.title}</p>
                              <p className="text-xs text-slate-500">{option.subtitle}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Payment Method Detail Panel */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6">
                    {/* OPTION 1: CASH */}
                    {paymentMethod === 'cash' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-slate-800">
                            Cash Amount Tendered ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={cashTendered}
                              onChange={(e) => setCashTendered(e.target.value)}
                              placeholder={orderTotals.total.toFixed(2)}
                              className="w-full pl-10 pr-4 py-3 text-lg font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          {/* Quick Denomination Pills */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-xs text-slate-500 mr-1">Quick tender:</span>
                            {quickCashAmounts.map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setCashTendered(amt.toFixed(2))}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                              >
                                ${amt.toFixed(2)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div
                          className={`p-5 rounded-xl border ${
                            isCashSufficient
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-amber-50 border-amber-200'
                          }`}
                        >
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                            {isCashSufficient ? 'Change Due to Customer' : 'Remaining Balance Due'}
                          </p>
                          <p
                            className={`text-3xl font-extrabold ${
                              isCashSufficient ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            ${Math.abs(cashChangeDue).toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-600 mt-2">
                            {isCashSufficient
                              ? 'Cash covers order grand total. Ready to generate order.'
                              : 'Enter an amount equal to or greater than the grand total.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* OPTION 2: CARD TERMINAL */}
                    {paymentMethod === 'card' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-slate-800">
                            POS Card Reader / Terminal Confirmation
                          </h3>
                          <p className="text-xs text-slate-500">
                            Ask customer to tap, insert, or swipe their card on your terminal for{' '}
                            <strong className="text-slate-800">
                              ${orderTotals.total.toFixed(2)}
                            </strong>
                            .
                          </p>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Card Last 4 Digits (Optional for Receipt)
                            </label>
                            <input
                              type="text"
                              maxLength={4}
                              value={cardLastFour}
                              onChange={(e) =>
                                setCardLastFour(e.target.value.replace(/\D/g, ''))
                              }
                              placeholder="e.g. 4242"
                              className="w-44 px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              Terminal Authorization Status
                            </p>
                            <p className="text-xs text-slate-500">
                              Confirm card payment approval before finalizing
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCardTerminalVerified(!cardTerminalVerified)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                              cardTerminalVerified
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>{cardTerminalVerified ? 'Approved' : 'Mark Approved'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* OPTION 3: QR / DIGITAL WALLET */}
                    {paymentMethod === 'qr' && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-5 text-center">
                          <DynamicQRCode
                            value={`${storeName}|AMT:${orderTotals.total.toFixed(2)}|ITEMS:${orderTotals.itemCount}`}
                            size={168}
                          />
                          <p className="text-xs font-semibold text-slate-600 mt-2">
                            Scan with Mobile Banking or Digital Wallet
                          </p>
                        </div>

                        <div className="md:col-span-7 space-y-4">
                          <div className="p-4 bg-white rounded-xl border border-slate-200">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Merchant</span>
                              <span className="font-semibold text-slate-800">{storeName}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>QR Amount Locked</span>
                              <span className="font-bold text-indigo-600">
                                ${orderTotals.total.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Instant Settlement</span>
                              <span className="text-emerald-600 font-semibold">Active</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <span className="text-xs font-semibold text-emerald-900">
                              Payment notification received on merchant wallet
                            </span>
                            <button
                              type="button"
                              onClick={() => setQrVerified(!qrVerified)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                qrVerified
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-700 border border-slate-300'
                              }`}
                            >
                              {qrVerified ? 'Verified ✓' : 'Verify'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OPTION 4: BANK TRANSFER */}
                    {paymentMethod === 'bank' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                          <p className="text-sm font-bold text-slate-900 mb-2">
                            Store Bank Account Details
                          </p>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Bank Name:</span>
                            <span className="font-semibold text-slate-800">
                              First Commercial Bank
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account Name:</span>
                            <span className="font-semibold text-slate-800">{storeName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account Number:</span>
                            <span className="font-mono font-bold text-indigo-600">
                              0194-8832-9910
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Transfer Reference / Transaction ID (Optional)
                          </label>
                          <input
                            type="text"
                            value={bankRefNumber}
                            onChange={(e) => setBankRefNumber(e.target.value)}
                            placeholder="Enter bank slip or reference #"
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <p className="text-xs text-slate-500">
                            Recorded directly on the customer receipt and order history.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FINAL BOTTOM CONFIRMATION BAR */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-slate-500">
                        Paying via{' '}
                        <strong className="text-slate-800 uppercase">{paymentMethod}</strong> •{' '}
                        {orderTotals.itemCount} items
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        Generates unique Order ID & printable customer receipt
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmPaymentAndGenerateOrder}
                      className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-200 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99]"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>
                        Confirm Payment & Generate Order (${orderTotals.total.toFixed(2)})
                      </span>
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ==================== TAB 2: INVENTORY / PRODUCTS MANAGER ==================== */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Store Products & Inventory</h2>
                <p className="text-xs text-slate-500">
                  Manage catalog items, prices, categories, and live stock counts
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Stock</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2.5">
                        <span className="text-xl">{prod.icon}</span>
                        <span>{prod.name}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">
                        {prod.sku || '—'}
                      </td>
                      <td className="py-3 px-3 font-bold text-indigo-600">
                        ${prod.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                            prod.stock > 10
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {prod.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            addToCart(prod);
                            setActiveTab('pos');
                            showToast(`Added "${prod.name}" to active order`);
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg bg-indigo-50"
                        >
                          + Order
                        </button>
                        <button
                          onClick={() => handleDeleteCatalogProduct(prod.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: COMPLETED ORDERS HISTORY ==================== */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Total Revenue</p>
                  <p className="text-2xl font-extrabold text-slate-900">
                    ${revenueStats.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Completed Orders</p>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {revenueStats.totalOrders}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Average Order Value
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900">
                    ${revenueStats.avgOrder.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">Orders History</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Filter by Order ID, customer, method..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-indigo-600">
                          {ord.id}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                          {ord.status}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ord.timestamp}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        {ord.customerName}{' '}
                        {ord.customerPhone && (
                          <span className="text-xs font-normal text-slate-500">
                            • {ord.customerPhone}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ord.paymentMethod} — {ord.paymentDetails}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-400">
                          {ord.items.reduce((s, i) => s + i.quantity, 0)} items
                        </p>
                        <p className="text-lg font-extrabold text-slate-900">
                          ${ord.total.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveReceipt(ord)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-indigo-500 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>View Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== MODAL 1: ADD CUSTOM PRODUCT / ITEM ==================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Custom Product / Item</h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Custom Gift Basket"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="15.00"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {DEFAULT_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Choose Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewProdIcon(emoji)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all ${
                        newProdIcon === emoji
                          ? 'border-indigo-600 bg-indigo-50 scale-110'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addDirectlyToOrder}
                  onChange={(e) => setAddDirectlyToOrder(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Also add immediately to current order
                </span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: PRINTABLE ORDER RECEIPT ==================== */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            {/* Receipt Content */}
            <div className="text-center border-b border-dashed border-slate-300 pb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">{storeName}</h3>
              <p className="text-xs text-slate-500">Official Payment & Order Receipt</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-mono font-bold text-slate-800">
                <span>{activeReceipt.id}</span>
                <span>•</span>
                <span>{activeReceipt.timestamp}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{activeReceipt.customerName}</span>
              </div>
              {activeReceipt.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone / Table:</span>
                  <span className="font-semibold text-slate-800">
                    {activeReceipt.customerPhone}
                  </span>
                </div>
              )}
              {activeReceipt.orderNote && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Note:</span>
                  <span className="font-medium text-slate-700">{activeReceipt.orderNote}</span>
                </div>
              )}
            </div>

            {/* Purchased Items */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2 max-h-52 overflow-y-auto">
              {activeReceipt.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-slate-800 font-medium">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-semibold text-slate-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${activeReceipt.subtotal.toFixed(2)}</span>
              </div>
              {activeReceipt.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({activeReceipt.discountLabel})</span>
                  <span>-${activeReceipt.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax ({activeReceipt.taxRate}%)</span>
                <span>${activeReceipt.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
                <span>Total Paid</span>
                <span>${activeReceipt.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Record */}
            <div className="py-3 text-xs space-y-1 bg-slate-50 rounded-xl px-3.5 mt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-800">{activeReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Details:</span>
                <span className="font-medium text-slate-700">{activeReceipt.paymentDetails}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}