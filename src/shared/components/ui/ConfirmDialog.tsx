/**
 * Accessible confirmation dialog.
 *
 * a11y:
 *   - Uses native <dialog>-style role + aria-modal
 *   - Closes on Escape and on backdrop click
 *   - Auto-focuses the confirm button
 *   - Restores focus to the previously focused element on close
 */

import { useEffect, useRef, type JSX, type ReactNode } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  onConfirm,
  onCancel,
  isPending = false
}: ConfirmDialogProps): JSX.Element | null {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPending) {
        event.preventDefault();
        onCancel();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus.current?.focus?.();
    };
  }, [open, onCancel, isPending]);

  if (!open) return null;

  return (
    <div
      className="dialog-backdrop"
      onClick={isPending ? undefined : onCancel}
      role="presentation"
    >
      <div
        className={`dialog dialog--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-desc' : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="dialog__title">
          {title}
        </h2>
        {description ? (
          <div id="confirm-dialog-desc" className="dialog__body">
            {description}
          </div>
        ) : null}
        <div className="dialog__actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={tone === 'danger' ? 'button button--danger' : 'button'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
