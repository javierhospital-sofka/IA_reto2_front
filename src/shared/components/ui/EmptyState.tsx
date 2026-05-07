/**
 * Reusable empty state. Replaces inline "No hay …" strings to provide a
 * consistent visual + clarifying call-to-action.
 */

import type { JSX, ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action
}: EmptyStateProps): JSX.Element {
  return (
    <div className="empty-state empty-state--card" role="status">
      <div className="empty-state__icon" aria-hidden>
        {icon ?? <Inbox size={28} />}
      </div>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
