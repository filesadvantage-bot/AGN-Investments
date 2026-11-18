import React, { useMemo, useState } from 'react';
import { Truck, Search, ExternalLink, X, Check } from 'lucide-react';
import { NCM_PARTNER_INFO, NCM_PORTAL_RATES, NCM_REGIONS } from '../data/ncmDeliveryRates';
import { NcmDeliveryType } from '../types/pos';
import { filterNcmBranches, formatNPR } from '../utils/posLogic';

interface NcmRateModalProps {
  isOpen: boolean;
  selectedDestination: string;
  selectedDeliveryType: NcmDeliveryType;
  fulfillmentMode: 'pickup' | 'ncm';
  onSelectRate: (destination: string, deliveryType: NcmDeliveryType) => void;
  onClose: () => void;
}

export function NcmRateModal({
  isOpen,
  selectedDestination,
  selectedDeliveryType,
  fulfillmentMode,
  onSelectRate,
  onClose
}: NcmRateModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');

  const filteredRates = useMemo(
    () => filterNcmBranches(NCM_PORTAL_RATES, selectedRegion, searchQuery),
    [selectedRegion, searchQuery]
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ncm-rate-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-red-400 shrink-0" />
              <h2 id="ncm-rate-modal-title" className="text-base sm:text-lg font-extrabold">
                Nepal Can Move (NCM) — Official Delivery Rate Sheet
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Nationwide live plant &amp; aquascaping courier rates based on NCM Portal Schedule
              (Home Delivery &amp; Branch/Office Delivery in NPR).
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close NCM rate sheet"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Official Partner External Links Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            <span className="font-bold text-slate-800">Official Logistics Partner:</span>{' '}
            {NCM_PARTNER_INFO.name} · Support {NCM_PARTNER_INFO.supportPhone}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={NCM_PARTNER_INFO.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
            >
              <span>nepalcanmove.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={NCM_PARTNER_INFO.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
            >
              <span>NCM Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={NCM_PARTNER_INFO.rateSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2"
            >
              <span>NCM-Portal-4 Reference Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Search & Region Filter Controls */}
        <div className="p-4 sm:px-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Search NCM destination branch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination branch (e.g. Tinkune, Pokhara, Butwal, Chitwan, Lukla)..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          <div className="shrink-0">
            <label htmlFor="ncm-region-filter" className="sr-only">
              Filter NCM branches by region
            </label>
            <select
              id="ncm-region-filter"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full sm:w-52 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              {NCM_REGIONS.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rate Schedule Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-xs font-bold text-slate-600">
                <th className="py-2.5 px-4">SN</th>
                <th className="py-2.5 px-4">Destination Branch (To)</th>
                <th className="py-2.5 px-4 hidden md:table-cell">Province / Hub</th>
                <th className="py-2.5 px-4 text-right">Home Delivery</th>
                <th className="py-2.5 px-4 text-right">Office Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                    No Nepal Can Move destination branches matched &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredRates.map((rate) => {
                  const isHomeSelected =
                    fulfillmentMode === 'ncm' &&
                    selectedDestination === rate.destination &&
                    selectedDeliveryType === 'home';
                  const isOfficeSelected =
                    fulfillmentMode === 'ncm' &&
                    selectedDestination === rate.destination &&
                    selectedDeliveryType === 'office';

                  return (
                    <tr key={rate.sn} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-2.5 px-4 font-mono tabular-nums text-xs text-slate-400">
                        {rate.sn}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900">{rate.destination}</div>
                        <div className="text-[11px] text-slate-500 md:hidden">{rate.region}</div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-500 hidden md:table-cell">
                        {rate.region}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectRate(rate.destination, 'home');
                            onClose();
                          }}
                          aria-label={`Select ${rate.destination} Home Delivery for ${formatNPR(rate.homeDeliveryFee)}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono tabular-nums text-xs font-bold transition-colors cursor-pointer ${
                            isHomeSelected
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {isHomeSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{formatNPR(rate.homeDeliveryFee)}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectRate(rate.destination, 'office');
                            onClose();
                          }}
                          aria-label={`Select ${rate.destination} Office Delivery for ${formatNPR(rate.officeDeliveryFee)}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono tabular-nums text-xs font-bold transition-colors cursor-pointer ${
                            isOfficeSelected
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {isOfficeSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{formatNPR(rate.officeDeliveryFee)}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredRates.length}</strong> of{' '}
            {NCM_PORTAL_RATES.length} NCM Portal branches · Click any Home or Office fee to apply to
            the active order
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
