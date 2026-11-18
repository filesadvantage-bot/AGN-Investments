import React, { useState } from 'react';
import { ShoppingBag, Sprout } from 'lucide-react';
import { AQUA_NEST_LOGO } from '../data/aquaticCatalog';
import type { ActiveGoogleAccount } from '../services/cloudSync';
import { ActiveTab, CatalogCollection } from '../types/pos';
import { formatNPR } from '../utils/posLogic';
import { GoogleGLogo } from './GoogleAuthModal';

interface HeaderProps {
  storeName: string;
  activeTab: ActiveTab;
  activeDepartment: string;
  activeCollection: CatalogCollection;
  cartItemCount: number;
  cartTotal: number;
  user: ActiveGoogleAccount | null;
  isAuthReady: boolean;
  onOpenAuthModal: () => void;
  onSelectMenuOption: (department: string, collection?: CatalogCollection) => void;
  onOpenOrderCart: () => void;
}

export function Header({
  storeName,
  activeTab,
  activeDepartment,
  activeCollection,
  cartItemCount,
  cartTotal,
  user,
  onOpenAuthModal,
  onSelectMenuOption,
  onOpenOrderCart
}: HeaderProps) {
  const [logoError, setLogoError] = useState(false);

  const navItems: Array<{
    label: string;
    department: string;
    collection?: CatalogCollection;
    isActive: boolean;
  }> = [
    {
      label: 'Aquarium Plants',
      department: 'Aquarium Plants',
      isActive:
        activeTab === 'pos' &&
        activeDepartment === 'Aquarium Plants' &&
        activeCollection !== 'sale'
    },
    {
      label: 'Plants by Placement',
      department: 'Plants by Placement',
      isActive:
        activeTab === 'pos' &&
        activeDepartment === 'Plants by Placement' &&
        activeCollection !== 'sale'
    },
    {
      label: 'Aquascaping',
      department: 'Aquascaping',
      isActive:
        activeTab === 'pos' &&
        activeDepartment === 'Aquascaping' &&
        activeCollection !== 'sale'
    },
    {
      label: 'Accessories',
      department: 'Accessories',
      isActive:
        activeTab === 'pos' &&
        activeDepartment === 'Accessories' &&
        activeCollection !== 'sale'
    },
    {
      label: 'Items on Sale',
      department: 'All',
      collection: 'sale',
      isActive: activeTab === 'pos' && activeCollection === 'sale'
    }
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Top-Left Logo + Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectMenuOption('All', 'all')}
          className="inline-flex items-center gap-2.5 text-base sm:text-lg font-extrabold tracking-tight text-slate-900 hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer text-left"
        >
          {!logoError ? (
            <img
              src={AQUA_NEST_LOGO}
              alt={`${storeName} logo`}
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-11 sm:h-12 w-auto object-contain mix-blend-multiply shrink-0"
            />
          ) : (
            <span
              aria-hidden="true"
              className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0"
            >
              <Sprout className="w-5 h-5" />
            </span>
          )}
          <span>{storeName}</span>
        </button>

        {/* Zone 2: 5 Concise Single-Line Store Navigation Links */}
        <nav
          aria-label="Store categories"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectMenuOption(item.department, item.collection || 'all')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                item.isActive
                  ? 'border-emerald-700 text-emerald-800 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Google Sign-In + Primary Cart & Checkout Action */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenAuthModal}
            aria-label={
              user
                ? `Google account ${user.displayName || user.email || ''}`
                : 'Sign in with Google'
            }
            className="inline-flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {user ? (
              <>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google avatar'}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="max-w-[96px] truncate">
                  {(user.displayName || user.email || 'Account').split(' ')[0]}
                </span>
              </>
            ) : (
              <>
                <GoogleGLogo className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Sign in with Google</span>
                <span className="sm:hidden">Sign in</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenOrderCart}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="tabular-nums">
              Cart ({cartItemCount})
              <span className="hidden md:inline"> · {formatNPR(cartTotal)}</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
