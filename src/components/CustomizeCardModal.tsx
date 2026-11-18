import React, { useEffect, useState } from 'react';
import { Upload, Pencil, Plus, Trash2, X, RotateCcw } from 'lucide-react';
import {
  AQUATIC_BRANDS,
  DEFAULT_CATEGORIES,
  INITIAL_PRODUCTS
} from '../data/aquaticCatalog';
import { PlantPlacement, PlantPortionOption, Product } from '../types/pos';
import { readAndOptimizeImageFile } from '../utils/imageUpload';
import { formatNPR } from '../utils/posLogic';
import { PlantImage } from './PlantImage';

interface CustomizeCardModalProps {
  product: Product | null;
  onClose: () => void;
  onSaveProduct: (updatedProduct: Product) => void;
}

export function CustomizeCardModal({
  product,
  onClose,
  onSaveProduct
}: CustomizeCardModalProps) {
  const [name, setName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [careNote, setCareNote] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Stem Plants');
  const [placement, setPlacement] = useState<PlantPlacement | ''>('');
  const [brand, setBrand] = useState('Aqua Nest');
  const [imageSrc, setImageSrc] = useState('');
  const [portionOptions, setPortionOptions] = useState<
    Array<{ label: string; priceDelta: string }>
  >([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setScientificName(product.scientificName || '');
    setCareNote(product.careNote || '');
    setPrice(String(product.price));
    setOriginalPrice(
      product.originalPrice && product.originalPrice > 0
        ? String(product.originalPrice)
        : ''
    );
    setStock(String(product.stock));
    setSku(product.sku || '');
    setCategory(product.category || 'Custom');
    setPlacement(product.placement || '');
    setBrand(product.brand || 'Aqua Nest');
    setImageSrc(product.image || '');
    setPortionOptions(
      product.portionOptions
        ? product.portionOptions.map((opt) => ({
            label: opt.label,
            priceDelta: String(opt.priceDelta)
          }))
        : []
    );
    setValidationError('');
  }, [product]);

  if (!product) return null;

  const defaultCatalogMatch = INITIAL_PRODUCTS.find((p) => p.id === product.id);

  const handleImageFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setValidationError('');
    setIsUploading(true);
    try {
      const optimizedDataUrl = await readAndOptimizeImageFile(file);
      setImageSrc(optimizedDataUrl);
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Unable to load the selected image.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDropImage = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    await handleImageFileSelected(file);
  };

  const handleAddPortionRow = () => {
    setPortionOptions((prev) => [
      ...prev,
      {
        label: prev.length === 0 ? 'Standard Portion' : `Option ${prev.length + 1}`,
        priceDelta: '0'
      }
    ]);
  };

  const handleUpdatePortionRow = (
    index: number,
    field: 'label' | 'priceDelta',
    value: string
  ) => {
    setPortionOptions((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleRemovePortionRow = (index: number) => {
    setPortionOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedPrice = Number(price);
    const parsedOriginal =
      originalPrice.trim() === '' ? undefined : Number(originalPrice);
    const parsedStock = Number(stock);

    if (!trimmedName) {
      setValidationError('Please enter a card title / item name.');
      return;
    }
    if (price.trim() === '' || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setValidationError('Please enter a valid price in Nepali Rupees (Rs.).');
      return;
    }
    if (
      parsedOriginal !== undefined &&
      (Number.isNaN(parsedOriginal) || parsedOriginal < 0)
    ) {
      setValidationError('Compare-at price must be a valid non-negative number.');
      return;
    }
    if (stock.trim() === '' || Number.isNaN(parsedStock) || parsedStock < 0) {
      setValidationError('Please enter a valid stock quantity.');
      return;
    }

    const cleanedPortions: PlantPortionOption[] = portionOptions
      .map((row) => ({
        label: row.label.trim(),
        priceDelta: Number(row.priceDelta) || 0
      }))
      .filter((row) => row.label.length > 0);

    const inferredDepartment = ['Soil & Substrate', 'Hardscape', 'Fertilizers'].includes(
      category
    )
      ? 'Aquascaping'
      : ['Lights', 'Filters & Media', 'Fish Food'].includes(category)
        ? 'Accessories'
        : category === 'Water Conditioner'
          ? 'Water Treatment'
          : 'Aquarium Plants';

    const updatedProduct: Product = {
      ...product,
      name: trimmedName,
      scientificName: scientificName.trim() || undefined,
      careNote: careNote.trim() || undefined,
      price: Number(parsedPrice.toFixed(2)),
      originalPrice:
        parsedOriginal !== undefined && parsedOriginal > parsedPrice
          ? Number(parsedOriginal.toFixed(2))
          : undefined,
      stock: Math.floor(parsedStock),
      sku: sku.trim() || product.sku,
      department: inferredDepartment,
      category: category.trim() || 'Custom',
      placement: placement || undefined,
      brand: brand.trim() || undefined,
      image: imageSrc.trim() || undefined,
      portionOptions: cleanedPortions.length > 0 ? cleanedPortions : undefined
    };

    onSaveProduct(updatedProduct);
    onClose();
  };

  const brandSuggestions = Array.from(
    new Set(['Aqua Nest', ...AQUATIC_BRANDS.filter((b) => b !== 'All Brands')])
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customize-card-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Pencil className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h2
                id="customize-card-modal-title"
                className="text-base sm:text-lg font-extrabold truncate"
              >
                Customize Product Card
              </h2>
              <p className="text-xs text-slate-300 truncate">
                Upload your own photo and edit card title, details, NPR price &amp; options
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close customize card modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form with Scrollable Fields + Pinned Footer */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {validationError && (
            <p
              role="alert"
              className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5"
            >
              {validationError}
            </p>
          )}

          {/* 1. Custom Image Upload & Live Preview */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={handleDropImage}
            className={`p-4 rounded-xl border-2 border-dashed transition-colors ${
              isDraggingFile
                ? 'border-emerald-600 bg-emerald-50/70'
                : 'border-slate-200 bg-slate-50/80'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <PlantImage
                src={imageSrc}
                alt={name || 'Card preview'}
                fallbackIcon={product.icon}
                variant="preview"
                className="!w-36 !rounded-xl shrink-0"
              />

              <div className="flex-1 min-w-0 space-y-2.5 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="customize-card-image-upload"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Processing Image...' : 'Upload Own Image'}</span>
                  </label>
                  <input
                    id="customize-card-image-upload"
                    type="file"
                    accept="image/*"
                    aria-label="Upload custom card image"
                    onChange={(e) => handleImageFileSelected(e.target.files?.[0])}
                    className="sr-only"
                  />

                  {defaultCatalogMatch?.image && imageSrc !== defaultCatalogMatch.image && (
                    <button
                      type="button"
                      onClick={() => setImageSrc(defaultCatalogMatch.image || '')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Default Photo</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  Upload JPG, PNG, WEBP, or GIF from your device (or drag &amp; drop here), or paste
                  an image URL below:
                </p>

                <input
                  type="text"
                  aria-label="Image URL or data path"
                  value={imageSrc.startsWith('data:') ? '' : imageSrc}
                  onChange={(e) => setImageSrc(e.target.value)}
                  placeholder={
                    imageSrc.startsWith('data:')
                      ? 'Using uploaded custom image from your device'
                      : 'https://... or /assets/...'
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* 2. Card Title, Subtitle & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="edit-card-name"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Card Title / Name *
              </label>
              <input
                id="edit-card-name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationError('');
                }}
                placeholder="e.g. Anubias Nana Petite Mother Pot"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label
                htmlFor="edit-card-subtitle"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Subtitle / Scientific Name
              </label>
              <input
                id="edit-card-subtitle"
                type="text"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                placeholder="e.g. Anubias barteri var. nana"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="edit-card-details"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Card Detail / Description &amp; Care Specs
              </label>
              <textarea
                id="edit-card-details"
                rows={2}
                value={careNote}
                onChange={(e) => setCareNote(e.target.value)}
                placeholder="Enter custom product details, size, lighting, CO2 needs, or specs..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-y"
              />
            </div>
          </div>

          {/* 3. Pricing, Sale Price, Stock & SKU */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="edit-card-price"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Price (Rs.) *
              </label>
              <input
                id="edit-card-price"
                type="number"
                min="0"
                step="1"
                required
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setValidationError('');
                }}
                className="w-full px-3 py-2 font-mono tabular-nums text-sm font-bold text-emerald-800 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label
                htmlFor="edit-card-original-price"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Old Price (Sale)
              </label>
              <input
                id="edit-card-original-price"
                type="number"
                min="0"
                step="1"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 font-mono tabular-nums text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label
                htmlFor="edit-card-stock"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Stock *
              </label>
              <input
                id="edit-card-stock"
                type="number"
                min="0"
                step="1"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 font-mono tabular-nums text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label
                htmlFor="edit-card-sku"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                SKU Code
              </label>
              <input
                id="edit-card-sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* 4. Category, Placement & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="edit-card-category"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Category
              </label>
              <select
                id="edit-card-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {DEFAULT_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                {!DEFAULT_CATEGORIES.includes(category) && (
                  <option value={category}>{category}</option>
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-card-placement"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Tank Placement
              </label>
              <select
                id="edit-card-placement"
                value={placement}
                onChange={(e) => setPlacement(e.target.value as PlantPlacement | '')}
                className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">None / Equipment</option>
                <option value="Foreground">Foreground</option>
                <option value="Midground">Midground</option>
                <option value="Background">Background</option>
                <option value="Floating">Floating</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-card-brand"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Brand / Grower
              </label>
              <input
                id="edit-card-brand"
                type="text"
                list="edit-card-brand-list"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Aqua Nest"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <datalist id="edit-card-brand-list">
                {brandSuggestions.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          {/* 5. Portion / Size Variants Editor */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Portion / Variant Options (Optional)
                </p>
                <p className="text-[11px] text-slate-500">
                  Adjust extra NPR price delta per portion, or remove all for a single flat price
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPortionRow}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-emerald-600 text-xs font-semibold text-slate-700 hover:text-emerald-800 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            </div>

            {portionOptions.length > 0 && (
              <div className="space-y-2 pt-1">
                {portionOptions.map((opt, idx) => {
                  const previewOptPrice = Math.max(
                    0,
                    (Number(price) || 0) + (Number(opt.priceDelta) || 0)
                  );
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        aria-label={`Option ${idx + 1} label`}
                        value={opt.label}
                        onChange={(e) => handleUpdatePortionRow(idx, 'label', e.target.value)}
                        placeholder="Option label (e.g. Potted)"
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                      />
                      <div className="w-28 shrink-0">
                        <input
                          type="number"
                          step="1"
                          aria-label={`Option ${idx + 1} price delta in Rs.`}
                          value={opt.priceDelta}
                          onChange={(e) =>
                            handleUpdatePortionRow(idx, 'priceDelta', e.target.value)
                          }
                          placeholder="+0"
                          className="w-full px-2.5 py-1.5 font-mono tabular-nums text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                      <span className="hidden sm:inline font-mono tabular-nums text-[11px] font-semibold text-emerald-700 w-24 text-right shrink-0">
                        {formatNPR(previewOptPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePortionRow(idx)}
                        aria-label={`Remove option ${opt.label || idx + 1}`}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          </div>

          {/* Pinned Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-white shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
            >
              Save Card Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
