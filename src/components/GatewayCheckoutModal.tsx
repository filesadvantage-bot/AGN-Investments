import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Smartphone, KeyRound, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { GatewayPaymentProof, GatewayProvider, OrderTotals } from '../types/pos';
import {
  buildEsewaGatewayPayload,
  buildKhaltiGatewayPayload,
  formatNPR,
  maskNepalMobile,
  validateNepalWalletCredentials
} from '../utils/posLogic';
import {
  BackendGatewayInitResponse,
  initiateGatewayViaBackend
} from '../services/cloudSync';

interface GatewayCheckoutModalProps {
  isOpen: boolean;
  provider: GatewayProvider;
  storeName: string;
  orderTotals: OrderTotals;
  onClose: () => void;
  onPaymentSuccess: (proof: GatewayPaymentProof) => void;
}

export function GatewayCheckoutModal({
  isOpen,
  provider,
  storeName,
  orderTotals,
  onClose,
  onPaymentSuccess
}: GatewayCheckoutModalProps) {
  const [mobile, setMobile] = useState('');
  const [mpin, setMpin] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [serverInit, setServerInit] = useState<BackendGatewayInitResponse | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMobile('');
    setMpin('');
    setOtp('');
    setError('');
    setServerInit(null);

    let active = true;
    void initiateGatewayViaBackend(provider, orderTotals, storeName).then((data) => {
      if (active && data) {
        setServerInit(data);
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen, provider, orderTotals, storeName]);

  if (!isOpen) return null;

  const isEsewa = provider === 'esewa';
  const esewaPayload = buildEsewaGatewayPayload(orderTotals);
  const khaltiPayload = buildKhaltiGatewayPayload(orderTotals, storeName);

  const handleFillSandboxCredentials = () => {
    setError('');
    if (isEsewa) {
      setMobile('9806800001');
      setMpin('1122');
      setOtp('123456');
    } else {
      setMobile('9800000001');
      setMpin('1111');
      setOtp('987654');
    }
  };

  const handleAuthorizePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateNepalWalletCredentials(provider, mobile, mpin, otp);
    if (!validation.valid) {
      setError(validation.error || 'Invalid wallet credentials.');
      return;
    }

    const prefix = isEsewa ? 'ESW' : 'KHL';
    const randomRef = Math.floor(100000 + Math.random() * 900000);
    const txRef =
      (isEsewa ? serverInit?.transactionUuid : serverInit?.purchaseOrderId) ||
      `${prefix}-${randomRef}`;
    const verifiedAt = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    onPaymentSuccess({
      provider,
      transactionId: txRef,
      payerAccount: maskNepalMobile(mobile),
      amountNPR: Number(orderTotals.total.toFixed(2)),
      amountPaisa: serverInit?.amountPaisa ?? khaltiPayload.amountPaisa,
      verifiedAt,
      mode: 'gateway'
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gateway-checkout-title"
      className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden my-8 shadow-2xl">
        {/* Branded Gateway Header */}
        <div
          className={`px-6 py-5 text-white flex items-center justify-between ${
            isEsewa ? 'bg-[#41A124]' : 'bg-[#5C2D91]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-extrabold text-lg tracking-tight"
            >
              {isEsewa ? 'eS' : 'Kh'}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/85 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isEsewa ? 'eSewa ePay v2 Checkout' : 'Khalti Web Checkout (KPG-2)'}</span>
              </p>
              <h3 id="gateway-checkout-title" className="text-lg font-extrabold leading-tight">
                {isEsewa ? 'Pay with eSewa Wallet' : 'Pay with Khalti Wallet'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment gateway modal"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAuthorizePayment} noValidate className="p-6 space-y-4">
          {/* Merchant & NPR Breakdown Summary */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Merchant</span>
              <span className="font-bold text-slate-900">{storeName}</span>
            </div>
            {isEsewa ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Merchant Code</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {serverInit?.merchantCode || esewaPayload.merchantCode}
                  </span>
                </div>
                {serverInit?.signature && (
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-slate-500 shrink-0">Server HMAC-SHA256</span>
                    <span className="font-mono text-[11px] text-emerald-700 truncate">
                      {serverInit.signature.slice(0, 18)}…
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Items Subtotal</span>
                  <span className="font-mono tabular-nums text-slate-700">
                    {formatNPR(esewaPayload.itemsSubtotal)}
                  </span>
                </div>
                {esewaPayload.deliveryCharge > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">NCM Delivery Charge</span>
                    <span className="font-mono tabular-nums text-slate-700">
                      {formatNPR(esewaPayload.deliveryCharge)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">KPG-2 Paisa Payload</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-700">
                    {khaltiPayload.amountPaisa.toLocaleString('en-IN')} paisa
                  </span>
                </div>
                {orderTotals.deliveryFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Includes NCM Delivery</span>
                    <span className="font-mono tabular-nums text-slate-700">
                      {formatNPR(orderTotals.deliveryFee)}
                    </span>
                  </div>
                )}
              </>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-bold text-slate-800 text-sm">Total Payable (NPR)</span>
              <span
                className={`font-mono tabular-nums text-lg font-extrabold ${
                  isEsewa ? 'text-[#2E7D18]' : 'text-[#5C2D91]'
                }`}
              >
                {formatNPR(orderTotals.total)}
              </span>
            </div>
          </div>

          {/* One-Click Sandbox Test Credential Helper */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200">
            <span className="text-xs text-slate-600">
              Testing POS checkout? Fill Nepal sandbox wallet:
            </span>
            <button
              type="button"
              onClick={handleFillSandboxCredentials}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-800 whitespace-nowrap shrink-0 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Fill Demo Wallet</span>
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5"
            >
              {error}
            </p>
          )}

          {/* Wallet Credentials Inputs */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="gateway-mobile-input"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                {isEsewa ? 'eSewa Mobile ID (10 Digits)' : 'Khalti Mobile Number (10 Digits)'}
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="gateway-mobile-input"
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder={isEsewa ? '9806800001' : '9800000001'}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="gateway-mpin-input"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  {isEsewa ? 'MPIN / Password' : 'Khalti MPIN'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="gateway-mpin-input"
                    type="password"
                    maxLength={6}
                    value={mpin}
                    onChange={(e) => {
                      setMpin(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    placeholder="••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="gateway-otp-input"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  6-Digit OTP Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="gateway-otp-input"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    placeholder={isEsewa ? '123456' : '987654'}
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tabular-nums border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 px-4 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isEsewa
                  ? 'bg-[#41A124] hover:bg-[#35861D]'
                  : 'bg-[#5C2D91] hover:bg-[#4A2276]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Authorize {isEsewa ? 'eSewa' : 'Khalti'} · {formatNPR(orderTotals.total)}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
