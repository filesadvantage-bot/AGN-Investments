import React, { useState } from 'react';
import { CheckCircle2, Printer, ExternalLink } from 'lucide-react';
import { AQUA_NEST_LOGO } from '../data/aquaticCatalog';
import { NCM_PARTNER_INFO } from '../data/ncmDeliveryRates';
import { OrderRecord } from '../types/pos';
import { formatNPR } from '../utils/posLogic';
import { PlantImage } from './PlantImage';

interface ReceiptModalProps {
  receipt: OrderRecord | null;
  storeName: string;
  onClose: () => void;
}

export function ReceiptModal({ receipt, storeName, onClose }: ReceiptModalProps) {
  const [logoError, setLogoError] = useState(false);

  if (!receipt) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="printable-receipt"
        className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 my-8"
      >
        <div className="text-center border-b border-dashed border-slate-300 pb-4">
          {!logoError ? (
            <img
              src={AQUA_NEST_LOGO}
              alt={`${storeName} logo`}
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-14 w-auto object-contain mix-blend-multiply mx-auto mb-1.5"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          )}
          <h3 id="receipt-modal-title" className="text-lg font-extrabold text-slate-900">
            {storeName}
          </h3>
          <p className="text-xs text-slate-500">Planted Tank Store · Official Order Receipt</p>
          <p className="mt-2 text-xs font-mono font-bold text-slate-700">
            {receipt.id} · {receipt.timestamp}
          </p>
        </div>

        {/* Customer Details */}
        <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer:</span>
            <span className="font-semibold text-slate-800">{receipt.customerName}</span>
          </div>
          {receipt.customerPhone && (
            <div className="flex justify-between">
              <span className="text-slate-500">Phone / Tank:</span>
              <span className="font-semibold text-slate-800">{receipt.customerPhone}</span>
            </div>
          )}
          {receipt.orderNote && (
            <div className="flex justify-between gap-4">
              <span className="text-slate-500 shrink-0">Packing Note:</span>
              <span className="font-medium text-slate-700 text-right">{receipt.orderNote}</span>
            </div>
          )}
          {receipt.deliveryInfo && (
            <>
              <div className="flex justify-between gap-4 pt-1">
                <span className="text-slate-500 shrink-0">Delivery Partner:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {receipt.deliveryInfo.mode === 'ncm'
                    ? `${receipt.deliveryInfo.partnerName} · ${receipt.deliveryInfo.destination} (${
                        receipt.deliveryInfo.deliveryType === 'home'
                          ? 'Home Delivery'
                          : 'Office Pickup'
                      })`
                    : 'Studio Counter Pickup'}
                </span>
              </div>
              {receipt.deliveryInfo.deliveryAddress && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">Street / Landmark:</span>
                  <span className="font-medium text-slate-700 text-right">
                    {receipt.deliveryInfo.deliveryAddress}
                  </span>
                </div>
              )}
              {receipt.deliveryInfo.trackingCode && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-500 shrink-0">NCM Consignment:</span>
                  <a
                    href={NCM_PARTNER_INFO.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                  >
                    <span>{receipt.deliveryInfo.trackingCode}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Purchased Items */}
        <div className="py-3 border-b border-dashed border-slate-300 space-y-2.5 max-h-56 overflow-y-auto">
          {receipt.items.map((item) => (
            <div key={item.cartKey} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <PlantImage
                  src={item.image}
                  alt={item.name}
                  fallbackIcon={item.icon}
                  variant="thumb"
                  className="!w-8 !h-8 !rounded-md"
                />
                <span className="text-slate-800 font-medium leading-tight">
                  {item.quantity}x {item.name}
                  {item.portionLabel ? ` (${item.portionLabel})` : ''}
                </span>
              </div>
              <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                {formatNPR(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals Breakdown */}
        <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums">{formatNPR(receipt.subtotal)}</span>
          </div>
          {(receipt.deliveryFee !== undefined || receipt.deliveryInfo) && (
            <div className="flex justify-between text-slate-600">
              <span>
                {receipt.deliveryInfo?.mode === 'ncm'
                  ? `NCM Delivery (${receipt.deliveryInfo.destination})`
                  : 'Delivery (Studio Pickup)'}
              </span>
              <span className="font-mono tabular-nums">
                {formatNPR(receipt.deliveryFee ?? receipt.deliveryInfo?.fee ?? 0)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
            <span>Total Paid</span>
            <span className="font-mono tabular-nums">{formatNPR(receipt.total)}</span>
          </div>
        </div>

        {/* Payment Record */}
        <div className="py-3 text-xs space-y-1 bg-slate-50 rounded-xl px-3.5 mt-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Method:</span>
            <span className="font-bold text-slate-800">{receipt.paymentMethod}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500 shrink-0">Details:</span>
            <span className="font-medium text-slate-700 text-right">{receipt.paymentDetails}</span>
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
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white"
          >
            New Order
          </button>
        </div>
      </div>
    </div>
  );
}
