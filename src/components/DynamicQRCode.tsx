import React, { useMemo } from 'react';
import { generateQRMatrix } from '../utils/posLogic';

interface DynamicQRCodeProps {
  value?: string;
  size?: number;
  accentColor?: string;
  label?: string;
}

export function DynamicQRCode({
  value = 'AQUASCAPE-ORDER',
  size = 168,
  accentColor = '#0f172a',
  label = 'Payment QR Code'
}: DynamicQRCodeProps) {
  const grid = useMemo(() => generateQRMatrix(value), [value]);
  const cellSize = size / 21;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-xl bg-white p-2.5 border border-slate-200 mx-auto"
      role="img"
      aria-label={label}
    >
      <rect width={size} height={size} fill="#ffffff" />
      {grid.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx * cellSize}
              y={rIdx * cellSize}
              width={cellSize + 0.35}
              height={cellSize + 0.35}
              rx={1.2}
              fill={accentColor}
            />
          ) : null
        )
      )}
    </svg>
  );
}
