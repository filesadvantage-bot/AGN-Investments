import React, { useState } from 'react';
import { ExternalLink, Truck } from 'lucide-react';
import { AQUA_NEST_LOGO } from '../data/aquaticCatalog';
import { NCM_PARTNER_INFO } from '../data/ncmDeliveryRates';
import { CatalogCollection } from '../types/pos';

interface StoreFooterProps {
  storeName: string;
  onSelectDepartment: (department: string, subcategory?: string, collection?: CatalogCollection) => void;
  onSelectBrand: (brand: string) => void;
  onOpenNcmRateModal: () => void;
}

export function StoreFooter({
  storeName,
  onSelectDepartment,
  onSelectBrand,
  onOpenNcmRateModal
}: StoreFooterProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            {!logoError && (
              <img
                src={AQUA_NEST_LOGO}
                alt={`${storeName} logo`}
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                className="h-11 w-auto object-contain mix-blend-multiply shrink-0"
              />
            )}
            <h3 className="font-bold text-slate-900 text-base">{storeName}</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Specialty planted aquarium studio in Nepal offering submerged &amp; tissue-culture
            aquatic plants, aquascaping hardscape, lighting, filtration, and water care.
          </p>
          <div className="pt-1 space-y-1 text-xs text-slate-500">
            <p>Siddhartha Sadak, Dallu Awash, Kathmandu</p>
            <p>Mon – Sat · 9:00 AM – 7:00 PM · +977 9818-108367</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <h4 className="font-bold text-slate-900 text-xs tracking-wide">Shop By Department</h4>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {[
              { label: 'Aquarium Live Plants', dept: 'Aquarium Plants' },
              { label: 'Plants by Placement', dept: 'Plants by Placement' },
              { label: 'Aquascaping & Soil', dept: 'Aquascaping' },
              { label: 'Aquarium Accessories', dept: 'Accessories' },
              { label: 'Water Treatment & Care', dept: 'Water Treatment' },
              { label: 'Items on Sale', dept: 'All', sale: true }
            ].map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() =>
                    onSelectDepartment(item.dept, 'All', item.sale ? 'sale' : 'all')
                  }
                  className="hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2.5">
          <h4 className="font-bold text-slate-900 text-xs tracking-wide">Featured Aquatic Brands</h4>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {[
              'Nature Aquatics',
              'Tropica 1-2-Grow!',
              'ADA',
              'The 2Hr Aquarist',
              'Seachem',
              'Aquatic Venturez'
            ].map((brand) => (
              <li key={brand}>
                <button
                  type="button"
                  onClick={() => onSelectBrand(brand)}
                  className="hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  {brand}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs tracking-wide flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>Delivery Partner · Nepal Can Move</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Insulated nationwide live plant dispatch across all 7 provinces (Rs. 70 – Rs. 320).
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5 text-xs">
              <button
                type="button"
                onClick={onOpenNcmRateModal}
                className="font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 cursor-pointer"
              >
                View NCM Rate Sheet
              </button>
              <a
                href={NCM_PARTNER_INFO.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-emerald-700 underline underline-offset-2"
              >
                <span>nepalcanmove.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={NCM_PARTNER_INFO.rateSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-emerald-700 underline underline-offset-2"
              >
                <span>NCM-Portal-4 Tariff</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1">
            <h4 className="font-bold text-slate-900 text-xs tracking-wide">
              Accepted Payments (NPR)
            </h4>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed">
              eSewa ePay · Khalti KPG-2 · Fonepay QR · ConnectIPS · Card · Cash
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {storeName}. All prices in Nepali Rupees (Rs. / NPR).
      </div>
    </footer>
  );
}
