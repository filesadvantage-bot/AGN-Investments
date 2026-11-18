export type ActiveTab = 'pos' | 'inventory' | 'history';
export type GatewayProvider = 'esewa' | 'khalti';
export type PaymentMethod = 'esewa' | 'khalti' | 'cash' | 'qr' | 'card' | 'bank';
export type PlantPlacement = 'Foreground' | 'Midground' | 'Background' | 'Floating';
export type CatalogCollection = 'all' | 'new' | 'bestseller' | 'sale';
export type FulfillmentMode = 'pickup' | 'ncm';
export type NcmDeliveryType = 'home' | 'office';

export interface NcmBranchRate {
  sn: number;
  fromHub: string;
  destination: string;
  region: string;
  homeDeliveryFee: number;
  officeDeliveryFee: number;
}

export interface OrderDeliveryInfo {
  mode: FulfillmentMode;
  partnerName: string;
  destination?: string;
  deliveryType?: NcmDeliveryType;
  deliveryAddress?: string;
  fee: number;
  trackingCode?: string;
}

export interface CatalogFilterState {
  department: string;
  subcategory: string;
  brand: string;
  collection: CatalogCollection;
  searchQuery: string;
}

export interface DepartmentMenuGroup {
  id: string;
  label: string;
  description: string;
  subcategories: string[];
}

export interface GatewayPaymentProof {
  provider: GatewayProvider;
  transactionId: string;
  payerAccount: string;
  amountNPR: number;
  amountPaisa: number;
  verifiedAt: string;
  mode: 'gateway' | 'qr';
}

export interface PlantPortionOption {
  label: string;
  priceDelta: number;
}

export interface Product {
  id: string;
  name: string;
  scientificName?: string;
  price: number;
  originalPrice?: number;
  department?: string;
  category: string;
  placement?: PlantPlacement;
  brand?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  stock: number;
  icon: string;
  image?: string;
  sku: string;
  careNote?: string;
  portionOptions?: PlantPortionOption[];
}

export interface CartItem {
  cartKey: string;
  productId: string;
  name: string;
  portionLabel?: string;
  price: number;
  quantity: number;
  icon: string;
  image?: string;
}

export interface OrderRecord {
  id: string;
  timestamp: string;
  customerName: string;
  customerPhone: string;
  orderNote: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee?: number;
  deliveryInfo?: OrderDeliveryInfo;
  total: number;
  paymentMethod: string;
  paymentDetails: string;
  status: 'Paid';
}

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

export interface SamplePlantTemplate {
  id: string;
  name: string;
  scientificName: string;
  price: number;
  department?: string;
  category: string;
  placement?: PlantPlacement;
  brand?: string;
  stock: number;
  icon: string;
  image?: string;
  careNote: string;
  portionOptions?: PlantPortionOption[];
}
