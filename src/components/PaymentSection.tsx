import React from 'react';
import {
  CheckCircle2,
  Banknote,
  CreditCard,
  QrCode,
  Building2,
  ShieldCheck,
  Wallet,
  Check,
  X
} from 'lucide-react';
import {
  GatewayPaymentProof,
  GatewayProvider,
  OrderTotals,
  PaymentMethod
} from '../types/pos';
import {
  buildEsewaGatewayPayload,
  buildKhaltiGatewayPayload,
  formatNPR
} from '../utils/posLogic';
import { DynamicQRCode } from './DynamicQRCode';

interface PaymentSectionProps {
  sectionRef: React.RefObject<HTMLElement | null>;
  storeName: string;
  orderTotals: OrderTotals;
  deliverySummaryLabel?: string;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  gatewayProofs: Partial<Record<GatewayProvider, GatewayPaymentProof>>;
  onOpenGatewayModal: (provider: GatewayProvider) => void;
  onQuickVerifyGatewayQr: (provider: GatewayProvider) => void;
  cashTendered: string;
  onCashTenderedChange: (val: string) => void;
  quickCashAmounts: number[];
  isCashSufficient: boolean;
  cashChangeDue: number;
  cardLastFour: string;
  onCardLastFourChange: (val: string) => void;
  cardTerminalVerified: boolean;
  onToggleCardVerified: () => void;
  qrVerified: boolean;
  onToggleQrVerified: () => void;
  bankRefNumber: string;
  onBankRefNumberChange: (val: string) => void;
  onCloseCheckout: () => void;
  onConfirmPayment: () => void;
}

export function PaymentSection({
  sectionRef,
  storeName,
  orderTotals,
  deliverySummaryLabel,
  paymentMethod,
  onPaymentMethodChange,
  gatewayProofs,
  onOpenGatewayModal,
  onQuickVerifyGatewayQr,
  cashTendered,
  onCashTenderedChange,
  quickCashAmounts,
  isCashSufficient,
  cashChangeDue,
  cardLastFour,
  onCardLastFourChange,
  cardTerminalVerified,
  onToggleCardVerified,
  qrVerified,
  onToggleQrVerified,
  bankRefNumber,
  onBankRefNumberChange,
  onCloseCheckout,
  onConfirmPayment
}: PaymentSectionProps) {
  const esewaPayload = buildEsewaGatewayPayload(orderTotals);
  const khaltiPayload = buildKhaltiGatewayPayload(orderTotals, storeName);
  const activeGatewayProof =
    paymentMethod === 'esewa' || paymentMethod === 'khalti'
      ? gatewayProofs[paymentMethod]
      : undefined;

  const paymentOptions: Array<{
    id: PaymentMethod;
    title: string;
    subtitle: string;
    badgeText?: string;
    badgeBg?: string;
    activeRing?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'esewa',
      title: 'eSewa',
      subtitle: 'ePay v2 Gateway & QR',
      badgeText: 'eS',
      badgeBg: 'bg-[#41A124] text-white',
      activeRing: 'border-[#41A124] bg-[#41A124]/5'
    },
    {
      id: 'khalti',
      title: 'Khalti',
      subtitle: 'KPG-2 Gateway & QR',
      badgeText: 'Kh',
      badgeBg: 'bg-[#5C2D91] text-white',
      activeRing: 'border-[#5C2D91] bg-[#5C2D91]/5'
    },
    {
      id: 'cash',
      title: 'Cash',
      subtitle: 'Auto change calculator',
      icon: Banknote
    },
    {
      id: 'qr',
      title: 'Fonepay QR',
      subtitle: 'Mobile Banking QR',
      icon: QrCode
    },
    {
      id: 'card',
      title: 'Card Terminal',
      subtitle: 'Credit / Debit / Tap',
      icon: CreditCard
    },
    {
      id: 'bank',
      title: 'Bank Transfer',
      subtitle: 'ConnectIPS / Wire',
      icon: Building2
    }
  ];

  const renderGatewayPanel = (provider: GatewayProvider) => {
    const isEsewa = provider === 'esewa';
    const proof = gatewayProofs[provider];
    const brandName = isEsewa ? 'eSewa' : 'Khalti';
    const protocolLabel = isEsewa ? 'eSewa ePay v2' : 'Khalti Web Checkout (KPG-2)';
    const accentHex = isEsewa ? '#2E7D18' : '#5C2D91';

    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Scannable Gateway QR Column */}
        <div className="md:col-span-4 text-center space-y-2">
          <DynamicQRCode
            value={`${brandName.toUpperCase()}|MERCHANT:${storeName}|AMT:${orderTotals.total.toFixed(2)}`}
            size={164}
            accentColor={accentHex}
            label={`${brandName} Dynamic Payment QR Code`}
          />
          <p className="text-xs font-bold text-slate-700">
            Scan with {brandName} Mobile App
          </p>
          <p className="text-[11px] text-slate-500">
            Or launch interactive {brandName} Web Checkout on the right
          </p>
        </div>

        {/* Gateway Breakdown + Interactive Web Checkout Trigger */}
        <div className="md:col-span-8 space-y-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Payment Gateway</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md ${
                  isEsewa
                    ? 'bg-[#41A124]/15 text-[#2E7D18]'
                    : 'bg-[#5C2D91]/15 text-[#5C2D91]'
                }`}
              >
                {protocolLabel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Merchant Account</span>
              <span className="font-semibold text-slate-800">{storeName}</span>
            </div>
            {isEsewa ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Merchant Code</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {esewaPayload.merchantCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Items Subtotal</span>
                  <span className="font-mono tabular-nums text-slate-700">
                    {formatNPR(esewaPayload.itemsSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {esewaPayload.deliveryCharge > 0
                      ? 'NCM Delivery Charge (ePay pdc)'
                      : 'Delivery Charge'}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-700">
                    {formatNPR(esewaPayload.deliveryCharge)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">KPG-2 Paisa Amount</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-700">
                    {khaltiPayload.amountPaisa.toLocaleString('en-IN')} paisa
                  </span>
                </div>
                {orderTotals.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Includes NCM Delivery</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-700">
                      {formatNPR(orderTotals.deliveryFee)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Supported Channels</span>
                  <span className="font-semibold text-slate-700">
                    Khalti Wallet · eBanking · ConnectIPS
                  </span>
                </div>
              </>
            )}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
              <span className="font-bold text-slate-800">Amount Payable (NPR)</span>
              <span
                className={`font-mono tabular-nums text-base font-extrabold ${
                  isEsewa ? 'text-[#2E7D18]' : 'text-[#5C2D91]'
                }`}
              >
                {formatNPR(orderTotals.total)}
              </span>
            </div>
          </div>

          {/* Interactive Gateway Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenGatewayModal(provider)}
              className={`flex-1 min-w-[210px] py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isEsewa
                  ? 'bg-[#41A124] hover:bg-[#35861D]'
                  : 'bg-[#5C2D91] hover:bg-[#4A2276]'
              }`}
            >
              <Wallet className="w-4 h-4 shrink-0" />
              <span>
                {proof
                  ? `Re-open ${brandName} Gateway`
                  : `Pay via ${brandName} Gateway (${formatNPR(orderTotals.total)})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onQuickVerifyGatewayQr(provider)}
              className="py-3 px-4 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-800 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              Verify Counter QR Scan
            </button>
          </div>

          {/* Gateway Verification Status Banner */}
          {proof ? (
            <div
              className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                isEsewa
                  ? 'bg-[#41A124]/10 border-[#41A124]/30 text-[#1F5A10]'
                  : 'bg-[#5C2D91]/10 border-[#5C2D91]/30 text-[#411E68]'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  {brandName} Verified · Ref{' '}
                  <span className="font-mono">{proof.transactionId}</span> · {proof.payerAccount}
                </span>
              </div>
              <span className="text-[11px] font-semibold opacity-80">
                Authorized {proof.verifiedAt}
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              Awaiting {brandName} authorization — click{' '}
              <strong>Pay via {brandName} Gateway</strong> to enter wallet credentials or{' '}
              <strong>Verify Counter QR Scan</strong> once customer scans QR.
            </div>
          )}
        </div>
      </div>
    );
  };

  const methodDisplayLabels: Record<PaymentMethod, string> = {
    esewa: 'eSewa Payment Gateway',
    khalti: 'Khalti Payment Gateway',
    cash: 'Cash',
    qr: 'Fonepay QR',
    card: 'Card Terminal',
    bank: 'Bank Transfer'
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="checkout-payment-heading"
      className="bg-white rounded-2xl border-2 border-emerald-700/80 overflow-hidden scroll-mt-20"
    >
      {/* Payment Section Header Banner */}
      <div className="bg-slate-900 text-white px-5 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Step 2 · Checkout &amp; Nepal Payment Gateways</span>
          </p>
          <h2 id="checkout-payment-heading" className="text-xl sm:text-2xl font-bold">
            Choose Payment Method to Complete Order
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-300">Amount Due</p>
            <p className="font-mono tabular-nums text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {formatNPR(orderTotals.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseCheckout}
            aria-label="Collapse payment section"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-6">
        {/* Payment Method Selector Cards */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-3">
            Select Payment Gateway or Counter Option
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {paymentOptions.map((option) => {
              const IconComp = option.icon;
              const active = paymentMethod === option.id;
              const activeBorder =
                option.activeRing || 'border-emerald-700 bg-emerald-50/60';

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onPaymentMethodChange(option.id)}
                  className={`p-3.5 rounded-xl border-2 text-left transition-colors flex flex-col justify-between gap-2.5 cursor-pointer ${
                    active ? activeBorder : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    {option.badgeText ? (
                      <div
                        aria-hidden="true"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs tracking-tight ${option.badgeBg}`}
                      >
                        {option.badgeText}
                      </div>
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          active ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {IconComp && <IconComp className="w-4 h-4" />}
                      </div>
                    )}
                    {active && (
                      <span
                        className={`w-5 h-5 rounded-md text-white flex items-center justify-center ${
                          option.id === 'esewa'
                            ? 'bg-[#41A124]'
                            : option.id === 'khalti'
                              ? 'bg-[#5C2D91]'
                              : 'bg-emerald-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 leading-tight">{option.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      {option.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Payment Method Detail Panel */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6">
          {/* OPTION: eSewa Payment Gateway */}
          {paymentMethod === 'esewa' && renderGatewayPanel('esewa')}

          {/* OPTION: Khalti Payment Gateway */}
          {paymentMethod === 'khalti' && renderGatewayPanel('khalti')}

          {/* OPTION: CASH */}
          {paymentMethod === 'cash' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <label
                  htmlFor="cash-tendered-input"
                  className="block text-sm font-bold text-slate-800"
                >
                  Cash Amount Tendered (Rs.)
                </label>
                <div className="relative">
                  <span className="font-mono text-sm font-bold text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    Rs.
                  </span>
                  <input
                    id="cash-tendered-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashTendered}
                    onChange={(e) => onCashTenderedChange(e.target.value)}
                    placeholder={orderTotals.total.toFixed(2)}
                    className="w-full pl-12 pr-4 py-3 font-mono tabular-nums text-lg font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 mr-1">Quick tender:</span>
                  {quickCashAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => onCashTenderedChange(amt.toFixed(2))}
                      className="px-3 py-1.5 rounded-lg font-mono tabular-nums text-xs font-bold bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      {formatNPR(amt)}
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
                <p className="text-xs font-semibold text-slate-600 mb-1">
                  {isCashSufficient ? 'Change Due to Customer' : 'Remaining Balance Due'}
                </p>
                <p
                  className={`font-mono tabular-nums text-3xl font-extrabold ${
                    isCashSufficient ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {formatNPR(Math.abs(cashChangeDue))}
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  {isCashSufficient
                    ? 'Cash covers order grand total. Ready to generate order.'
                    : 'Enter an amount equal to or greater than the grand total.'}
                </p>
              </div>
            </div>
          )}

          {/* OPTION: CARD TERMINAL */}
          {paymentMethod === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">
                  POS Card Reader / Terminal Confirmation
                </h3>
                <p className="text-xs text-slate-500">
                  Ask customer to tap, insert, or swipe their card on your terminal for{' '}
                  <strong className="font-mono tabular-nums text-slate-800">
                    {formatNPR(orderTotals.total)}
                  </strong>
                  .
                </p>
                <div>
                  <label
                    htmlFor="card-last-four"
                    className="block text-xs font-semibold text-slate-600 mb-1"
                  >
                    Card Last 4 Digits (Optional for Receipt)
                  </label>
                  <input
                    id="card-last-four"
                    type="text"
                    maxLength={4}
                    value={cardLastFour}
                    onChange={(e) => onCardLastFourChange(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 4242"
                    className="w-44 px-3.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">Terminal Authorization Status</p>
                  <p className="text-xs text-slate-500">
                    Confirm card payment approval before finalizing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggleCardVerified}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
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

          {/* OPTION: FONEPAY QR */}
          {paymentMethod === 'qr' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 text-center">
                <DynamicQRCode
                  value={`FONEPAY|${storeName}|AMT:${orderTotals.total.toFixed(2)}|ITEMS:${orderTotals.itemCount}`}
                  size={164}
                  label="Fonepay Interoperable QR Code"
                />
                <p className="text-xs font-semibold text-slate-600 mt-2">
                  Scan with Mobile Banking (Fonepay)
                </p>
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Merchant</span>
                    <span className="font-semibold text-slate-800">{storeName}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>QR Amount Locked (NPR)</span>
                    <span className="font-mono tabular-nums font-bold text-emerald-700">
                      {formatNPR(orderTotals.total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Instant Settlement</span>
                    <span className="text-emerald-700 font-semibold">Fonepay Active</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-xs font-semibold text-emerald-900">
                    Payment notification received on merchant terminal
                  </span>
                  <button
                    type="button"
                    onClick={onToggleQrVerified}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
                      qrVerified
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-slate-700 border border-slate-300'
                    }`}
                  >
                    {qrVerified ? 'Verified' : 'Verify'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OPTION: BANK TRANSFER */}
          {paymentMethod === 'bank' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <p className="text-sm font-bold text-slate-900 mb-2">Store Bank Account Details</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-semibold text-slate-800">Nabil Bank Ltd. (Nepal)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Name:</span>
                  <span className="font-semibold text-slate-800">{storeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-700">
                    0190-1017-5883-201
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bank-ref-input" className="block text-xs font-bold text-slate-700">
                  ConnectIPS / Bank Reference ID (Optional)
                </label>
                <input
                  id="bank-ref-input"
                  type="text"
                  value={bankRefNumber}
                  onChange={(e) => onBankRefNumberChange(e.target.value)}
                  placeholder="Enter ConnectIPS or bank slip #"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
              Paying via <strong className="text-slate-800">{methodDisplayLabels[paymentMethod]}</strong>
              {activeGatewayProof ? ` · Ref ${activeGatewayProof.transactionId}` : ''} ·{' '}
              <span className="tabular-nums">{orderTotals.itemCount}</span> items
              {deliverySummaryLabel ? ` · ${deliverySummaryLabel}` : ''}
            </p>
            <p className="text-sm font-semibold text-slate-700">
              Generates unique Order ID &amp; printable customer receipt
            </p>
          </div>

          <button
            type="button"
            onClick={onConfirmPayment}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base flex items-center justify-center gap-2.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="tabular-nums">
              Confirm Payment &amp; Generate Order ({formatNPR(orderTotals.total)})
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
