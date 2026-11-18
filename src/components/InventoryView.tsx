import React from 'react';
import { Plus, AlertTriangle, Pencil } from 'lucide-react';
import { Product } from '../types/pos';
import { formatNPR } from '../utils/posLogic';
import { PlantImage } from './PlantImage';

interface InventoryViewProps {
  storeName: string;
  onStoreNameChange: (name: string) => void;
  products: Product[];
  onOpenAddModal: () => void;
  onEditProduct: (product: Product) => void;
  onQuickOrderProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export function InventoryView({
  storeName,
  onStoreNameChange,
  products,
  onOpenAddModal,
  onEditProduct,
  onQuickOrderProduct,
  onDeleteProduct
}: InventoryViewProps) {
  return (
    <section
      aria-labelledby="inventory-heading"
      className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 id="inventory-heading" className="text-xl font-bold text-slate-900">
            Aquatic Plants &amp; Store Inventory
          </h2>
          <p className="text-xs text-slate-500">
            Manage botanical catalog species, placement zones, brands, pricing, and live tank stock
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label htmlFor="store-name-setting" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Store Receipt Title
            </label>
            <input
              id="store-name-setting"
              type="text"
              value={storeName}
              onChange={(e) => onStoreNameChange(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Aquatic Plant / Item</span>
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
          <p className="text-sm font-medium text-slate-600">No products in inventory</p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="mt-3 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
          >
            Add First Plant
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3 px-3">Plant / Item</th>
                <th className="py-3 px-3">Department &amp; Placement</th>
                <th className="py-3 px-3">Portion Options</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-right">Base Price</th>
                <th className="py-3 px-3 text-right">Stock</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <PlantImage
                        src={prod.image}
                        alt={prod.name}
                        fallbackIcon={prod.icon}
                        variant="thumb"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{prod.name}</p>
                        <p className="text-xs text-slate-500">
                          {prod.brand ? `${prod.brand} · ` : ''}
                          <span className="italic">{prod.scientificName || prod.category}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{prod.category}</span>
                    {prod.placement && (
                      <span className="text-emerald-700 font-medium"> · {prod.placement}</span>
                    )}
                    {prod.careNote && (
                      <span className="text-slate-500 block mt-0.5">{prod.careNote}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-500">
                    {prod.portionOptions && prod.portionOptions.length > 0
                      ? prod.portionOptions.map((o) => o.label).join(' / ')
                      : 'Standard'}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-500">
                    {prod.sku || '—'}
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums font-bold text-emerald-700 text-right whitespace-nowrap">
                    {formatNPR(prod.price)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center justify-end gap-1 font-mono tabular-nums text-xs font-semibold ${
                        prod.stock > 10 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {prod.stock <= 10 && <AlertTriangle className="w-3.5 h-3.5" />}
                      {prod.stock} units
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap space-x-2">
                    <button
                      type="button"
                      onClick={() => onEditProduct(prod)}
                      aria-label={`Customize ${prod.name}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-emerald-800 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-600 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickOrderProduct(prod)}
                      aria-label={`Add ${prod.name} to active order`}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-2.5 py-1 rounded-lg bg-emerald-50 cursor-pointer"
                    >
                      + Order
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(prod.id)}
                      aria-label={`Delete ${prod.name} from catalog`}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1 cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
