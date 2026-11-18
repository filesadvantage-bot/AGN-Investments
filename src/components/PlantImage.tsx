import React, { useState, useEffect } from 'react';

interface PlantImageProps {
  src?: string;
  alt: string;
  fallbackIcon?: string;
  variant?: 'card' | 'thumb' | 'preview';
  className?: string;
}

export function PlantImage({
  src,
  alt,
  fallbackIcon = '🌿',
  variant = 'card',
  className = ''
}: PlantImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeClasses =
    variant === 'card'
      ? 'aspect-[4/3] w-full rounded-t-xl'
      : variant === 'preview'
        ? 'aspect-[4/3] w-28 rounded-xl border border-emerald-200'
        : 'w-11 h-11 rounded-lg border border-slate-200';

  return (
    <div
      className={`relative overflow-hidden bg-emerald-950/5 flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            variant === 'card' ? 'group-hover:scale-105' : ''
          }`}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100/70 text-emerald-800"
          aria-hidden="true"
        >
          <span className={variant === 'card' ? 'text-3xl' : 'text-lg'}>{fallbackIcon}</span>
        </div>
      )}
    </div>
  );
}
