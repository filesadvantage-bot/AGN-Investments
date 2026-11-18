import React, { useMemo } from 'react';
import {
  Receipt,
  RotateCcw,
  User,
  Phone,
  FileText,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowDown,
  Truck,
  Store,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { NCM_PARTNER_INFO, NCM_PORTAL_RATES, NCM_REGIONS } from '../data/ncmDeliveryRates';
import {
  CartItem,
  FulfillmentMode,
  NcmBranchRate,
  NcmDeliveryType,
  OrderTotals
} from '../types/pos';
import { formatNPR } from '../utils/posLogic';
import { PlantImage } from './PlantImage';

interface OrderSidebarProps {
  cart: CartItem[];
  orderTotals: OrderTotals;
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (val: string) => void;
  orderNote: string;
  onOrderNoteChange: (val: string) => void;
  showCustomerFields: boolean;
  onToggleCustomerFields: () => void;
  fulfillmentMode: FulfillmentMode;
  onFulfillmentModeChange: (mode: FulfillmentMode) => void;
  ncmDestination: string;
  onNcmDestinationChange: (destination: string) => void;
  ncmDeliveryType: NcmDeliveryType;
  onNcmDeliveryTypeChange: (type: NcmDeliveryType) => void;
  ncmAddress: string;
  onNcmAddressChange: (address: string) => void;
  selectedNcmBranch?: NcmBranchRate;
  onOpenNcmRateModal: () => void;
  isCheckoutOpen: boolean;
  onUpdateQuantity: (cartKey: string, delta: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onClearOrder: () => void;
  onProceedToCheckout: () => void;
}

export function OrderSidebar({
  cart,
  orderTotals,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  orderNote,
  onOrderNoteChange,
  showCustomerFields,
  onToggleCustomerFields,
  fulfillmentMode,
  onFulfillmentModeChange,
  ncmDestination,
  onNcmDestinationChange,
  ncmDeliveryType,
  onNcmDeliveryTypeChange,
  ncmAddress,
  onNcmAddressChange,
  selectedNcmBranch,
  onOpenNcmRateModal,
  isCheckoutOpen,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onProceedToCheckout
}: OrderSidebarProps) {
  const groupedRegions = useMemo(
    () => NCM_REGIONS.filter((r) => r !== 'All Regions'),
    []
  );

  return (
    <section
      id="current-order-sidebar"
      aria-labelledby="current-order-heading"
      className="lg:col-span-4 lg:sticky lg:top-20 bg-white rounded-2xl border border-slate-200 overflow-hidden scroll-mt-20"
    >
      {/* Order Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <Receipt className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h2 id="current-order-heading" className="font-bold text-base">
              Current Order
            </h2>
            <p className="text-xs text-slate-300 tabular-nums">
              {orderTotals.itemCount} {orderTotals.itemCount === 1 ? 'item' : 'items'} in cart
            </p>
          </div>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearOrder}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-200 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Optional Customer Details Accordion */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200">
        <button
          type="button"
          aria-expanded={showCustomerFields}
          onClick={onToggleCustomerFields}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer"
        >
          <span className="flex items-center gap-2 truncate">
            <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">
              {customerName
                ? `Aquascaper: ${customerName}`
                : 'Add Customer / Tank Setup Note (Optional)'}
            </span>
          </span>
          <span className="text-emerald-700 ml-2 shrink-0">
            {showCustomerFields ? 'Hide' : 'Edit'}
          </span>
        </button>

        {showCustomerFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-2 border-t border-slate-200">
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                aria-label="Customer name"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="Customer name"
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                aria-label="Phone or tank size"
                value={customerPhone}
                onChange={(e) => onCustomerPhoneChange(e.target.value)}
                placeholder="Phone or Tank (e.g. 9841...)"
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="sm:col-span-2 relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                aria-label="Special packing or aquascape note"
                value={orderNote}
                onChange={(e) => onOrderNoteChange(e.target.value)}
                placeholder="Packing note (e.g. damp wrap, insulated box)..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Cart Line Items */}
      <div className="p-4 sm:p-5 max-h-72 overflow-y-auto divide-y divide-slate-100">
        {cart.length === 0 ? (
          <div className="py-8 text-center">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Your planted order is empty</p>
            <p className="text-xs text-slate-400 mt-1">
              Select aquatic plants or hardscape from the catalog to build an order
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const fullTitle = item.portionLabel
              ? `${item.name} (${item.portionLabel})`
              : item.name;
            return (
              <div
                key={item.cartKey}
                className="py-3 first:pt-0 last:pb-0 space-y-2"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PlantImage
                      src={item.image}
                      alt={item.name}
                      fallbackIcon={item.icon}
                      variant="thumb"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-snug truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight truncate mt-0.5">
                        {item.portionLabel ? `${item.portionLabel} · ` : ''}
                        <span className="font-mono tabular-nums text-emerald-700 font-medium">
                          {formatNPR(item.price)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.cartKey)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                    aria-label={`Remove ${fullTitle} from order`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pl-13.5">
                  <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.cartKey, -1)}
                      className="p-1 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                      aria-label={`Decrease quantity of ${fullTitle}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-mono tabular-nums text-xs font-bold text-slate-800 min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.cartKey, 1)}
                      className="p-1 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                      aria-label={`Increase quantity of ${fullTitle}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-mono tabular-nums text-sm font-bold text-slate-900">
                    {formatNPR(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Nepal Can Move (NCM) Delivery Partner & Fulfillment Section */}
      <div className="px-4 sm:px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Delivery / Fulfillment</span>
          </span>
          <button
            type="button"
            onClick={onOpenNcmRateModal}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 cursor-pointer"
          >
            NCM Rate Sheet
          </button>
        </div>

        {/* Fulfillment Toggle: Studio Pickup vs Nepal Can Move */}
        <div
          role="group"
          aria-label="Order fulfillment mode"
          className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/75 rounded-lg"
        >
          <button
            type="button"
            onClick={() => onFulfillmentModeChange('pickup')}
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              fulfillmentMode === 'pickup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span>Studio Pickup</span>
          </button>
          <button
            type="button"
            onClick={() => onFulfillmentModeChange('ncm')}
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              fulfillmentMode === 'ncm'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>Nepal Can Move</span>
          </button>
        </div>

        {fulfillmentMode === 'ncm' && (
          <div className="space-y-2.5 pt-1">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label
                  htmlFor="ncm-destination-select"
                  className="text-[11px] font-semibold text-slate-600"
                >
                  NCM Destination Branch ({NCM_PORTAL_RATES.length} hubs)
                </label>
                <a
                  href={NCM_PARTNER_INFO.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700"
                >
                  <span>nepalcanmove.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <select
                id="ncm-destination-select"
                value={ncmDestination}
                onChange={(e) => onNcmDestinationChange(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {groupedRegions.map((reg) => (
                  <optgroup key={reg} label={reg}>
                    {NCM_PORTAL_RATES.filter((r) => r.region === reg).map((rate) => (
                      <option key={rate.sn} value={rate.destination}>
                        {rate.destination} — Home Rs. {rate.homeDeliveryFee} / Office Rs.{' '}
                        {rate.officeDeliveryFee}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {selectedNcmBranch && (
              <div
                role="group"
                aria-label="Nepal Can Move delivery service type"
                className="grid grid-cols-2 gap-2"
              >
                <button
                  type="button"
                  onClick={() => onNcmDeliveryTypeChange('home')}
                  className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    ncmDeliveryType === 'home'
                      ? 'bg-emerald-50/90 border-emerald-600 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-[11px] font-bold">Home Delivery</span>
                  <span className="block font-mono tabular-nums text-xs font-extrabold text-emerald-700 mt-0.5">
                    {formatNPR(selectedNcmBranch.homeDeliveryFee)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNcmDeliveryTypeChange('office')}
                  className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    ncmDeliveryType === 'office'
                      ? 'bg-emerald-50/90 border-emerald-600 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-[11px] font-bold">NCM Branch Pickup</span>
                  <span className="block font-mono tabular-nums text-xs font-extrabold text-emerald-700 mt-0.5">
                    {formatNPR(selectedNcmBranch.officeDeliveryFee)}
                  </span>
                </button>
              </div>
            )}

            {ncmDeliveryType === 'home' && (
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Delivery street address or landmark"
                  value={ncmAddress}
                  onChange={(e) => onNcmAddressChange(e.target.value)}
                  placeholder={`Street / landmark in ${ncmDestination} (optional)`}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Order Totals (Subtotal + NCM Delivery + Grand Total) */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums font-medium">
              {formatNPR(orderTotals.subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="truncate pr-2">
              {fulfillmentMode === 'ncm'
                ? `NCM Delivery (${ncmDestination} · ${ncmDeliveryType === 'home' ? 'Home' : 'Office'})`
                : 'Delivery (Studio Pickup)'}
            </span>
            <span className="font-mono tabular-nums font-medium shrink-0">
              {formatNPR(orderTotals.deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-base font-bold text-slate-900">
            <span>Grand Total</span>
            <span className="font-mono tabular-nums text-xl text-emerald-700">
              {formatNPR(orderTotals.total)}
            </span>
          </div>
        </div>

        {/* Prominent Checkout Action Button */}
        <button
          type="button"
          onClick={onProceedToCheckout}
          disabled={cart.length === 0}
          className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            cart.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
          }`}
        >
          <span>
            {isCheckoutOpen
              ? 'Select Payment Option Below'
              : `Checkout Order · ${formatNPR(orderTotals.total)}`}
          </span>
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
