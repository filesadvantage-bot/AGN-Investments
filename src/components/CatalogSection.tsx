import React, { useState } from 'react';
import { Search, Plus, Package, X, LayoutGrid, ChevronDown, RotateCcw, Pencil } from 'lucide-react';
import { AQUATIC_BRANDS, DEPARTMENT_MENU_GROUPS } from '../data/aquaticCatalog';
import {
  CartItem,
  CatalogCollection,
  CatalogFilterState,
  Product
} from '../types/pos';
import { formatNPR, getProductCartQuantity, resolvePortionPrice } from '../utils/posLogic';
import { PlantImage } from './PlantImage';

interface CatalogSectionProps {
  products: Product[];
  totalCatalogCount: number;
  filters: CatalogFilterState;
  onUpdateFilters: (patch: Partial<CatalogFilterState>) => void;
  onResetFilters: () => void;
  selectedPortions: Record<string, number>;
  onSelectPortion: (productId: string, optionIdx: number) => void;
  cart: CartItem[];
  onAddToCart: (product: Product, optionIdx: number) => void;
  onEditProduct: (product: Product) => void;
  onOpenAddModal: () => void;
}

export function CatalogSection({
  products,
  totalCatalogCount,
  filters,
  onUpdateFilters,
  onResetFilters,
  selectedPortions,
  onSelectPortion,
  cart,
  onAddToCart,
  onEditProduct,
  onOpenAddModal
}: CatalogSectionProps) {
  const [isDeptMenuOpen, setIsDeptMenuOpen] = useState(false);

  const activeGroup = DEPARTMENT_MENU_GROUPS.find((g) => g.id === filters.department);
  const quickSubcategories = activeGroup
    ? ['All', ...activeGroup.subcategories]
    : [
        'All',
        'Anubias',
        'Bucephalandra',
        'Carpeting',
        'Stem Plants',
        'Cryptocoryne & Swords',
        'Soil & Substrate',
        'Lights',
        'Water Conditioner'
      ];

  const hasActiveFilters =
    filters.department !== 'All' ||
    filters.subcategory !== 'All' ||
    filters.brand !== 'All Brands' ||
    filters.collection !== 'all' ||
    filters.searchQuery.trim() !== '';

  const collectionTabs: Array<{ id: CatalogCollection; label: string }> = [
    { id: 'all', label: 'All Products' },
    { id: 'new', label: 'New Arrivals' },
    { id: 'bestseller', label: 'Best Selling' },
    { id: 'sale', label: 'Items on Sale' }
  ];

  return (
    <section
      id="store-catalog-section"
      aria-labelledby="catalog-heading"
      className="lg:col-span-8 space-y-5 scroll-mt-20"
    >
      {/* Nature Aquatics Style Menu Bar: Shopping By Categories + Search + Brand Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* "Shopping By Categories" Mega-Menu Trigger */}
          <button
            type="button"
            aria-expanded={isDeptMenuOpen}
            aria-controls="shopping-categories-menu"
            onClick={() => setIsDeptMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Shopping By Categories</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isDeptMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Integrated Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Search for products, categories, brands, or SKU"
              value={filters.searchQuery}
              onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
              placeholder="Search plants, brands, or SKU..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => onUpdateFilters({ searchQuery: '' })}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Brand Selector */}
          <div className="shrink-0">
            <label htmlFor="brand-filter-select" className="sr-only">
              Filter by Aquatic Brand
            </label>
            <select
              id="brand-filter-select"
              value={filters.brand}
              onChange={(e) => onUpdateFilters({ brand: e.target.value })}
              className="w-full md:w-44 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              {AQUATIC_BRANDS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expandable Multi-Column Department Mega-Menu (Nature Aquatics Taxonomy) */}
        {isDeptMenuOpen && (
          <div
            id="shopping-categories-menu"
            className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {DEPARTMENT_MENU_GROUPS.map((group) => {
              const isDeptSelected = filters.department === group.id;
              return (
                <div
                  key={group.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateFilters({ department: group.id, subcategory: 'All' });
                      setIsDeptMenuOpen(false);
                    }}
                    className={`text-sm font-bold text-left hover:text-emerald-700 transition-colors cursor-pointer ${
                      isDeptSelected ? 'text-emerald-800' : 'text-slate-900'
                    }`}
                  >
                    {group.label}
                  </button>
                  <p className="text-[11px] text-slate-500 leading-snug">{group.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {group.subcategories.map((sub) => {
                      const activeSub =
                        filters.department === group.id && filters.subcategory === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            onUpdateFilters({ department: group.id, subcategory: sub });
                            setIsDeptMenuOpen(false);
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            activeSub
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-500 hover:text-emerald-800'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Collection Tabs (All / New Arrivals / Best Selling / Items on Sale) + Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <h2 id="catalog-heading" className="sr-only">
              Store Product Catalog
            </h2>
            <div
              role="group"
              aria-label="Product collections"
              className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
            >
              {collectionTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onUpdateFilters({ collection: tab.id })}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    filters.collection === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="tabular-nums">
              Showing <strong className="text-slate-800">{products.length}</strong> of{' '}
              {totalCatalogCount} items
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Subcategory / Placement Quick Filter Bar */}
        <div
          role="group"
          aria-label="Filter by category or tank placement"
          className="flex flex-wrap items-center gap-1.5"
        >
          {filters.department !== 'All' && (
            <button
              type="button"
              onClick={() => onUpdateFilters({ department: 'All', subcategory: 'All' })}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {filters.department} ×
            </button>
          )}
          {quickSubcategories.map((sub) => {
            const active = filters.subcategory === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => onUpdateFilters({ subcategory: sub })}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {sub === 'All'
                  ? filters.department === 'Plants by Placement'
                    ? 'All Tank Zones'
                    : 'All Categories'
                  : sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Cards Grid */}
      {products.length === 0 ? (
        <div className="bg-white text-center py-14 px-4 border border-slate-200 rounded-2xl">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            No matching aquatic plants or equipment found
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Try clearing active filters or add a species from the sample aquatic plant options.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sample Plant</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((product) => {
            const optionIdx = selectedPortions[product.id] ?? 0;
            const { price: activePrice, portionLabel } = resolvePortionPrice(product, optionIdx);
            const inCartQty = getProductCartQuantity(cart, product.id);
            const hasOptions = Boolean(product.portionOptions && product.portionOptions.length > 0);
            const isOnSale = Boolean(
              product.originalPrice && product.originalPrice > product.price
            );
            const activeOriginalPrice =
              isOnSale && product.originalPrice
                ? activePrice + (product.originalPrice - product.price)
                : undefined;

            return (
              <article
                key={product.id}
                className={`rounded-xl border overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 flex flex-col justify-between bg-white ${
                  inCartQty > 0
                    ? 'border-emerald-600 ring-1 ring-emerald-600/25'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Primary Clickable Photo + Clean Unboxed Metadata */}
                <button
                  type="button"
                  onClick={() => onAddToCart(product, optionIdx)}
                  aria-label={`Add ${product.name}${portionLabel ? ` (${portionLabel})` : ''} to order for ${formatNPR(activePrice)}`}
                  className="w-full text-left flex-1 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer group"
                >
                  <div className="w-full">
                    <div className="relative">
                      <PlantImage
                        src={product.image}
                        alt={
                          product.scientificName
                            ? `${product.name} (${product.scientificName})`
                            : product.name
                        }
                        fallbackIcon={product.icon}
                        variant="card"
                      />
                      {inCartQty > 0 ? (
                        <span className="absolute top-2.5 right-2.5 font-mono tabular-nums text-xs font-bold text-white bg-emerald-700/95 px-2 py-1 rounded-md">
                          {inCartQty} in order
                        </span>
                      ) : isOnSale ? (
                        <span className="absolute top-2.5 left-2.5 text-[11px] font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded-md">
                          Sale
                        </span>
                      ) : null}
                    </div>

                    <div className="p-3.5 pb-2.5">
                      {/* Zero-Pill Unboxed Metadata Line */}
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate mb-1">
                        {product.brand && (
                          <>
                            <span className="font-semibold text-emerald-800 shrink-0">
                              {product.brand}
                            </span>
                            <span aria-hidden="true" className="shrink-0">
                              ·
                            </span>
                          </>
                        )}
                        <span className="truncate">{product.category}</span>
                        {product.placement && (
                          <>
                            <span aria-hidden="true" className="shrink-0">
                              ·
                            </span>
                            <span className="shrink-0">{product.placement}</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                        {product.name}
                      </h3>

                      {product.scientificName && (
                        <p className="text-xs italic text-slate-500 truncate mt-0.5">
                          {product.scientificName}
                        </p>
                      )}

                      {product.careNote && (
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                          {product.careNote}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                {/* Portion Option Selector + Baseline-Aligned NPR Price & Add Button */}
                <div className="px-3.5 pb-3.5 pt-2.5 border-t border-slate-100 space-y-2.5">
                  {hasOptions && product.portionOptions && (
                    <div>
                      <label htmlFor={`portion-${product.id}`} className="sr-only">
                        Portion option for {product.name}
                      </label>
                      <select
                        id={`portion-${product.id}`}
                        value={optionIdx}
                        onChange={(e) => onSelectPortion(product.id, Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 cursor-pointer"
                      >
                        {product.portionOptions.map((opt, idx) => {
                          const optPrice = Math.max(0, product.price + opt.priceDelta);
                          return (
                            <option key={opt.label} value={idx}>
                              {opt.label} — {formatNPR(optPrice)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      {activeOriginalPrice && (
                        <del className="block font-mono tabular-nums text-[11px] leading-tight text-slate-400 whitespace-nowrap">
                          {formatNPR(activeOriginalPrice)}
                        </del>
                      )}
                      <span className="block font-mono tabular-nums text-sm font-extrabold text-emerald-700 leading-snug whitespace-nowrap">
                        {formatNPR(activePrice)}
                      </span>
                      <p className="text-[11px] text-slate-400 tabular-nums truncate mt-0.5">
                        {product.stock} in stock · {product.sku}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        aria-label={`Customize ${product.name}`}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-600 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onAddToCart(product, optionIdx)}
                        aria-label={`Quick add ${product.name}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
