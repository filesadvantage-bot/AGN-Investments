/**
 * Converts an uploaded image File into an optimized Data URL suitable for
 * instant card preview, cart/receipt rendering, and localStorage persistence.
 */
export function readAndOptimizeImageFile(
  file: File,
  maxDimension = 900,
  quality = 0.86
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, WEBP, or GIF).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the selected image file.'));
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawDataUrl) {
        reject(new Error('Selected image file was empty.'));
        return;
      }

      // Preserve animated GIFs or SVGs directly without canvas rasterization
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        if (!w || !h || (w <= maxDimension && h <= maxDimension && file.size <= 350 * 1024)) {
          resolve(rawDataUrl);
          return;
        }

        const scale = Math.min(1, maxDimension / Math.max(w, h));
        const targetW = Math.max(1, Math.round(w * scale));
        const targetH = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressed = canvas.toDataURL(outputType, quality);
        resolve(compressed);
      };
      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
