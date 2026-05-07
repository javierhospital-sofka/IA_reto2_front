import type { ReactNode } from 'react';

type StatusBadgeProps = {
  tone?: 'default' | 'danger' | 'warn';
  children: ReactNode;
};

export function StatusBadge({ tone = 'default', children }: StatusBadgeProps) {
  return <span className={`badge ${tone === 'default' ? '' : tone}`}>{children}</span>;
}
