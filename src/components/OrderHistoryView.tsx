import React from 'react';
import { TrendingUp, Receipt, Tag, Search, Clock } from 'lucide-react';
import { OrderRecord } from '../types/pos';
import { formatNPR } from '../utils/posLogic';

interface OrderHistoryViewProps {
  orders: OrderRecord[];
  revenueStats: {
    totalRevenue: number;
    totalOrders: number;
    avgOrder: number;
  };
  historySearch: string;
  onHistorySearchChange: (val: string) => void;
  onViewReceipt: (order: OrderRecord) => void;
}

export function OrderHistoryView({
  orders,
  revenueStats,
  historySearch,
  onHistorySearchChange,
  onViewReceipt
}: OrderHistoryViewProps) {
  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Revenue</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-slate-900">
              {formatNPR(revenueStats.totalRevenue)}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Completed Orders</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-slate-900">
              {revenueStats.totalOrders}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Average Order Value</p>
            <p className="font-mono tabular-nums text-2xl font-extrabold text-slate-900">
              {formatNPR(revenueStats.avgOrder)}
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <section
        aria-labelledby="orders-history-heading"
        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 id="orders-history-heading" className="text-lg font-bold text-slate-900">
            Orders History
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Filter orders by ID, customer, or payment method"
              value={historySearch}
              onChange={(e) => onHistorySearchChange(e.target.value)}
              placeholder="Filter by Order ID, customer, method..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm font-medium text-slate-600">No matching orders found</p>
            <p className="text-xs text-slate-400 mt-1">
              Completed planted tank orders will appear here with full receipts.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-mono font-bold text-sm text-emerald-700">{ord.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-emerald-700">{ord.status}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ord.timestamp}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {ord.customerName}
                    {ord.customerPhone && (
                      <span className="text-xs font-normal text-slate-500">
                        {' '}
                        · {ord.customerPhone}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {ord.paymentMethod} — {ord.paymentDetails}
                  </p>
                  {ord.deliveryInfo && (
                    <p className="text-xs text-slate-600">
                      {ord.deliveryInfo.mode === 'ncm' ? (
                        <>
                          Delivery: <strong className="font-semibold text-slate-800">{ord.deliveryInfo.partnerName}</strong> ·{' '}
                          {ord.deliveryInfo.destination} (
                          {ord.deliveryInfo.deliveryType === 'home' ? 'Home' : 'Office'}) ·{' '}
                          <span className="font-mono tabular-nums font-semibold text-emerald-700">
                            {formatNPR(ord.deliveryInfo.fee)}
                          </span>
                          {ord.deliveryInfo.trackingCode
                            ? ` · Ref ${ord.deliveryInfo.trackingCode}`
                            : ''}
                        </>
                      ) : (
                        'Fulfillment: Studio Counter Pickup · Rs. 0.00'
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-400 tabular-nums">
                      {ord.items.reduce((s, i) => s + i.quantity, 0)} items
                    </p>
                    <p className="font-mono tabular-nums text-lg font-extrabold text-slate-900">
                      {formatNPR(ord.total)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewReceipt(ord)}
                    aria-label={`View receipt for ${ord.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-emerald-600 text-xs font-semibold text-slate-700 hover:text-emerald-700 whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
