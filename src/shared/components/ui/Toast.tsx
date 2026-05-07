/**
 * Accessible toast notification system.
 *
 * Why: replaces silent mutation success and raw HTTP error messages with
 * polite, dismissable feedback. Uses an aria-live region so screen readers
 * announce updates without stealing focus.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type JSX,
  type ReactNode
} from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'warning' | 'error' | 'info';

export interface ToastInput {
  id?: string;
  tone: ToastTone;
  title: string;
  description?: string;
  durationMs?: number;
}

export interface Toast extends Required<Omit<ToastInput, 'description'>> {
  description?: string;
}

interface ToastContextValue {
  push: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 4500;

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function ToastProvider({ children }: PropsWithChildren): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const handle = timeouts.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timeouts.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = toast.id ?? generateId();
      const durationMs = toast.durationMs ?? DEFAULT_DURATION_MS;
      const next: Toast = {
        id,
        tone: toast.tone,
        title: toast.title,
        description: toast.description,
        durationMs
      };
      setToasts((current) => [...current.filter((t) => t.id !== id), next]);

      if (durationMs > 0) {
        const handle = setTimeout(() => dismiss(id), durationMs);
        timeouts.current.set(id, handle);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const handles = timeouts.current;
    return () => {
      handles.forEach((handle) => clearTimeout(handle));
      handles.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      dismiss,
      success: (title, description) => push({ tone: 'success', title, description }),
      error: (title, description) =>
        push({ tone: 'error', title, description, durationMs: 7000 }),
      warning: (title, description) => push({ tone: 'warning', title, description }),
      info: (title, description) => push({ tone: 'info', title, description })
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return context;
}

const TONE_ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 size={18} aria-hidden />,
  warning: <AlertTriangle size={18} aria-hidden />,
  error: <XCircle size={18} aria-hidden />,
  info: <Info size={18} aria-hidden />
};

interface ToasterProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function Toaster({ toasts, onDismiss }: ToasterProps): JSX.Element {
  return (
    <div className="toast-region" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
          <span className="toast__icon">{TONE_ICONS[toast.tone]}</span>
          <div className="toast__content">
            <strong>{toast.title}</strong>
            {toast.description ? <p>{toast.description}</p> : null}
          </div>
          <button
            type="button"
            className="toast__close"
            aria-label="Cerrar notificación"
            onClick={() => onDismiss(toast.id)}
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
