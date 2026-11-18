import React from 'react';
import { Store, Package, History, Plus, ArrowRight, Truck } from 'lucide-react';
import { HERO_BANNER_IMAGE } from '../data/aquaticCatalog';
import { ActiveTab, CatalogCollection } from '../types/pos';
import { PlantImage } from './PlantImage';

interface StorefrontHeroProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  productsCount: number;
  ordersCount: number;
  onOpenAddModal: () => void;
  onOpenNcmRateModal: () => void;
  onExploreDepartment: (department: string, collection?: CatalogCollection) => void;
}

export function StorefrontHero({
  activeTab,
  onTabChange,
  productsCount,
  ordersCount,
  onOpenAddModal,
  onOpenNcmRateModal,
  onExploreDepartment
}: StorefrontHeroProps) {
  return (
    <div className="space-y-5 mb-6">
      {/* Workspace Mode Switcher & Quick Add Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div
          role="tablist"
          aria-label="Store workspace views"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/75 rounded-lg max-w-full"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pos'}
            onClick={() => onTabChange('pos')}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Storefront &amp; POS</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inventory'}
            onClick={() => onTabChange('inventory')}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="tabular-nums">Plants &amp; Stock ({productsCount})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => onTabChange('history')}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="tabular-nums">Orders ({ordersCount})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Add Plant / Sample Option</span>
        </button>
      </div>

      {/* Editorial Nature Aquarium Split Hero (Shown on Storefront & POS tab) */}
      {activeTab === 'pos' && (
        <section
          aria-label="Nature Aquarium Featured Showcase"
          className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-slate-200 bg-[#0D2119] items-stretch"
        >
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-white">
            <div className="space-y-3">
              <p className="text-xs font-medium text-emerald-300/90 tracking-wide">
                Aqua Nest · Kathmandu, Nepal · Nationwide Delivery via Nepal Can Move
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-[2.15rem] font-extrabold tracking-tight leading-[1.15] text-balance">
                Aqua Nest — Live Aquatic Plants, Substrates &amp; Studio Gear
              </h1>
              <p className="text-sm text-slate-200/90 leading-relaxed max-w-xl">
                Browse potted rhizomes, sterile 1-2-Grow! tissue cups, plants by tank placement,
                ADA &amp; APT aquascaping supplies, Nepal Can Move (NCM) nationwide courier rates,
                and instant checkout with eSewa &amp; Khalti.
              </p>
            </div>

            <div className="pt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onExploreDepartment('Aquarium Plants', 'all')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <span>Shop Live Plants</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onExploreDepartment('Plants by Placement', 'all')}
                className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Plants by Placement
              </button>
              <button
                type="button"
                onClick={onOpenNcmRateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-emerald-200 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>NCM Delivery Rates</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[220px] sm:min-h-[260px]">
            <PlantImage
              src={HERO_BANNER_IMAGE}
              alt="Rimless Nature Aquarium planted with Anubias, Rotala H'ra, and Monte Carlo carpet"
              className="!aspect-auto !rounded-none w-full h-full"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 sm:p-5 text-white">
              <p className="text-xs font-medium text-slate-200">
                Featured Scape · 90P Rimless Gallery · Anubias Petite · Rotala H&apos;ra · Monte Carlo
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
