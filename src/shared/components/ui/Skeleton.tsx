/**
 * Lightweight loading skeleton.
 * Replace ad-hoc "Cargando…" strings to give the user a sense of layout
 * stability while data is fetched.
 */

import type { CSSProperties, JSX } from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  className?: string;
  ariaLabel?: string;
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  className,
  ariaLabel
}: SkeletonProps): JSX.Element {
  const style: CSSProperties = {
    width: width ?? (variant === 'circle' ? 32 : '100%'),
    height: height ?? (variant === 'text' ? 14 : variant === 'circle' ? 32 : 18),
    borderRadius: variant === 'circle' ? '50%' : variant === 'text' ? 4 : 8
  };
  return (
    <span
      className={`skeleton ${className ?? ''}`}
      role="status"
      aria-label={ariaLabel ?? 'Cargando'}
      aria-live="polite"
      style={style}
    />
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }): JSX.Element {
  return (
    <div className="skeleton-rows" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} variant="rect" height={48} />
      ))}
    </div>
  );
}
