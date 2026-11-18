import React, { useState } from 'react';
import { X, Sprout, Upload } from 'lucide-react';
import {
  AQUATIC_BRANDS,
  DEFAULT_CATEGORIES,
  ICON_OPTIONS,
  INITIAL_PRODUCTS,
  SAMPLE_AQUATIC_PLANT_TEMPLATES
} from '../data/aquaticCatalog';
import { PlantPlacement, PlantPortionOption, Product } from '../types/pos';
import { readAndOptimizeImageFile } from '../utils/imageUpload';
import { formatNPR } from '../utils/posLogic';
import { PlantImage } from './PlantImage';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProduct: (product: Product, addDirectlyToOrder: boolean) => void;
}

export function AddProductModal({
  isOpen,
  onClose,
  onCreateProduct
}: AddProductModalProps) {
  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [name, setName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Stem Plants');
  const [placement, setPlacement] = useState<PlantPlacement | ''>('Midground');
  const [brand, setBrand] = useState('Nature Aquatics');
  const [stock, setStock] = useState('20');
  const [careNote, setCareNote] = useState('');
  const [icon, setIcon] = useState('🌿');
  const [imageUrl, setImageUrl] = useState('');
  const [includeTissueOption, setIncludeTissueOption] = useState(true);
  const [presetPortions, setPresetPortions] = useState<PlantPortionOption[] | undefined>(undefined);
  const [addDirectlyToOrder, setAddDirectlyToOrder] = useState(true);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const fallbackCategoryImage =
    INITIAL_PRODUCTS.find((p) => p.category === category)?.image || INITIAL_PRODUCTS[0]?.image;
  const effectivePreviewImage = imageUrl.trim() || fallbackCategoryImage;

  const handleSelectSampleOption = (templateId: string) => {
    setSelectedSampleId(templateId);
    setValidationError('');
    if (!templateId) {
      setPresetPortions(undefined);
      setImageUrl('');
      return;
    }
    const tpl = SAMPLE_AQUATIC_PLANT_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setName(tpl.name);
    setScientificName(tpl.scientificName);
    setPrice(tpl.price.toFixed(2));
    setCategory(tpl.category);
    setPlacement(tpl.placement || 'Midground');
    setBrand(tpl.brand || 'Nature Aquatics');
    setStock(String(tpl.stock));
    setCareNote(tpl.careNote);
    setIcon(tpl.icon);
    setImageUrl(tpl.image || '');
    setPresetPortions(tpl.portionOptions);
  };

  const resetForm = () => {
    setSelectedSampleId('');
    setName('');
    setScientificName('');
    setPrice('');
    setCategory('Stem Plants');
    setPlacement('Midground');
    setBrand('Nature Aquatics');
    setStock('20');
    setCareNote('');
    setIcon('🌿');
    setImageUrl('');
    setIncludeTissueOption(true);
    setPresetPortions(undefined);
    setAddDirectlyToOrder(true);
    setValidationError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!trimmedName) {
      setValidationError('Please enter a plant or item name.');
      return;
    }
    if (price.trim() === '' || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setValidationError('Please enter a valid non-negative price.');
      return;
    }
    if (stock.trim() === '' || Number.isNaN(parsedStock) || parsedStock < 0) {
      setValidationError('Please enter a valid stock count.');
      return;
    }

    const portionOptions: PlantPortionOption[] | undefined = presetPortions
      ? presetPortions
      : includeTissueOption
        ? [
            { label: 'Potted / Standard', priceDelta: 0 },
            { label: '1-2-Grow! Tissue Cup', priceDelta: 250 }
          ]
        : undefined;

    const inferredDepartment = ['Soil & Substrate', 'Hardscape', 'Fertilizers'].includes(category)
      ? 'Aquascaping'
      : ['Lights', 'Filters & Media', 'Fish Food'].includes(category)
        ? 'Accessories'
        : category === 'Water Conditioner'
          ? 'Water Treatment'
          : 'Aquarium Plants';

    const newProduct: Product = {
      id: `aq-cust-${Date.now()}`,
      name: trimmedName,
      scientificName: scientificName.trim() || undefined,
      price: Number(parsedPrice.toFixed(2)),
      department: inferredDepartment,
      category: category || 'Custom',
      placement: placement || undefined,
      brand: brand || 'Nature Aquatics',
      isNewArrival: true,
      stock: Math.floor(parsedStock),
      icon,
      image: effectivePreviewImage,
      sku: `NA-${Math.floor(100 + Math.random() * 900)}`,
      careNote: careNote.trim() || undefined,
      portionOptions
    };

    onCreateProduct(newProduct, addDirectlyToOrder);
    resetForm();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-plant-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 my-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-700" />
            <h3 id="add-plant-modal-title" className="text-lg font-bold text-slate-900">
              Add Aquatic Plant or Store Item
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close add item modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Sample Aquatic Plants on Option Selector + Live Photo Preview */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <div>
              <label
                htmlFor="sample-aquatic-plant-select"
                className="block text-xs font-bold text-emerald-900 mb-1.5"
              >
                Sample Aquatic Plants Option (Quick Auto-Fill)
              </label>
              <select
                id="sample-aquatic-plant-select"
                value={selectedSampleId}
                onChange={(e) => handleSelectSampleOption(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">— Custom entry or choose a sample aquatic plant —</option>
                {SAMPLE_AQUATIC_PLANT_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.scientificName}) — {formatNPR(tpl.price)} · {tpl.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 bg-white/90 p-2.5 rounded-xl border border-emerald-200/80">
              <PlantImage
                src={effectivePreviewImage}
                alt={name || 'Selected plant preview'}
                fallbackIcon={icon}
                variant="preview"
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {name || 'Botanical Species Photo Preview'}
                  </p>
                  <label
                    htmlFor="add-modal-image-upload"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Image</span>
                  </label>
                  <input
                    id="add-modal-image-upload"
                    type="file"
                    accept="image/*"
                    aria-label="Upload custom photo for new item"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const dataUrl = await readAndOptimizeImageFile(file);
                        setImageUrl(dataUrl);
                        setValidationError('');
                      } catch (err) {
                        setValidationError(
                          err instanceof Error ? err.message : 'Could not read image file.'
                        );
                      }
                    }}
                    className="sr-only"
                  />
                </div>
                <p className="text-[11px] italic text-slate-500 truncate">
                  {scientificName || `Auto-matched to ${category}`}
                </p>
                <input
                  type="url"
                  aria-label="Custom plant image URL (optional)"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={
                    imageUrl.startsWith('data:')
                      ? 'Using uploaded custom photo'
                      : 'Or paste custom photo URL...'
                  }
                  className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {validationError && (
            <p
              role="alert"
              className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2"
            >
              {validationError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="plant-name-input" className="block text-xs font-bold text-slate-700 mb-1">
                Plant / Item Name *
              </label>
              <input
                id="plant-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationError('');
                }}
                placeholder="e.g. Bucephalandra Brownie Ghost"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label
                htmlFor="scientific-name-input"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Scientific / Botanical Subtitle
              </label>
              <input
                id="scientific-name-input"
                type="text"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                placeholder="e.g. Bucephalandra sp."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="plant-price-input" className="block text-xs font-bold text-slate-700 mb-1">
                Price (Rs.) *
              </label>
              <input
                id="plant-price-input"
                type="number"
                required
                min="0"
                step="1"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setValidationError('');
                }}
                placeholder="1650"
                className="w-full px-3 py-2 font-mono tabular-nums text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label htmlFor="plant-stock-input" className="block text-xs font-bold text-slate-700 mb-1">
                Stock *
              </label>
              <input
                id="plant-stock-input"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value);
                  setValidationError('');
                }}
                className="w-full px-3 py-2 font-mono tabular-nums text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label
                htmlFor="plant-category-select"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Category
              </label>
              <select
                id="plant-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {DEFAULT_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="plant-placement-select"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Tank Placement Zone
              </label>
              <select
                id="plant-placement-select"
                value={placement}
                onChange={(e) => setPlacement(e.target.value as PlantPlacement | '')}
                className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">Not Applicable (Equipment)</option>
                <option value="Foreground">Foreground</option>
                <option value="Midground">Midground</option>
                <option value="Background">Background</option>
                <option value="Floating">Floating</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="plant-brand-select"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Brand / Grower
              </label>
              <select
                id="plant-brand-select"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {AQUATIC_BRANDS.filter((b) => b !== 'All Brands').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="care-note-input" className="block text-xs font-bold text-slate-700 mb-1">
              Care / Aquascape Specs (Optional)
            </label>
            <input
              id="care-note-input"
              type="text"
              value={careNote}
              onChange={(e) => setCareNote(e.target.value)}
              placeholder="e.g. Low–Med Light · CO2 Recommended · Shrimp Safe"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700 mb-1.5">Choose Botanical Icon</p>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  aria-label={`Select icon ${emoji}`}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors ${
                    icon === emoji
                      ? 'border-emerald-700 bg-emerald-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {!presetPortions && (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTissueOption}
                  onChange={(e) => setIncludeTissueOption(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                />
                <span className="text-xs font-medium text-slate-700">
                  Include Potted &amp; 1-2-Grow! Tissue Cup (+Rs. 250.00) portion options
                </span>
              </label>
            )}

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={addDirectlyToOrder}
                onChange={(e) => setAddDirectlyToOrder(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
              />
              <span className="text-xs font-semibold text-slate-700">
                Also add immediately to current order
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Save Plant / Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
