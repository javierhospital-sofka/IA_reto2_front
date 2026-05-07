/**
 * Modal con buscador + lista de tiendas.
 *
 * Reemplaza el wizard "Paso 1: selecciona la tienda". El usuario abre el
 * picker desde el panel "Sede activa" del sidebar, busca por nombre o ciudad,
 * y al confirmar el sistema crea o reabre el inventario y navega a Productos.
 */

import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Check, Loader2 } from 'lucide-react';
import { getStores } from '../../api/catalogApi';
import { createInventory } from '../../api/inventoryApi';
import { getApiErrorMessage } from '../../lib/getApiErrorMessage';
import { useToast } from './Toast';

interface SedePickerDialogProps {
  open: boolean;
  onClose: () => void;
  currentStoreId: string | null;
}

export function SedePickerDialog({
  open,
  onClose,
  currentStoreId
}: SedePickerDialogProps): JSX.Element | null {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const storesQuery = useQuery({
    queryKey: ['stores'],
    queryFn: getStores,
    enabled: open,
    staleTime: 60_000
  });

  const mutation = useMutation({
    mutationFn: (storeId: string) => createInventory({ storeId, idempotencyKey: `web-${storeId}` }),
    onSuccess(response) {
      const inv = response.data;
      sessionStorage.setItem('activeInventoryId', inv.inventoryId);
      sessionStorage.setItem('activeStoreId', inv.storeId);
      queryClient.invalidateQueries({ queryKey: ['inventory-state', inv.inventoryId] });
      toast.success('Sede activa', `Operando sobre ${inv.storeId}`);
      onClose();
      navigate(`/inventories/${inv.inventoryId}/products`);
    },
    onError(error) {
      const msg = getApiErrorMessage(error);
      toast.error(msg.title, msg.description);
    }
  });

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => inputRef.current?.focus());

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !mutation.isPending) {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previousFocus.current?.focus?.();
    };
  }, [open, onClose, mutation.isPending]);

  const stores = storesQuery.data?.data ?? [];
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return stores;
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.city.toLowerCase().includes(needle) ||
        s.storeId.toLowerCase().includes(needle)
    );
  }, [stores, search]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={mutation.isPending ? undefined : onClose} role="presentation">
      <div
        className="dialog dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sede-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="sede-picker-title" className="dialog__title">Cambiar sede</h2>
        <p className="dialog__sub">Elige la tienda sobre la que vas a operar. El inventario es idempotente: si ya existe se reabre, si no se crea.</p>

        <div className="sede-picker__search">
          <Search size={16} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar por nombre, ciudad o ID…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar tienda"
          />
        </div>

        <div className="sede-picker__list" role="listbox" aria-label="Tiendas disponibles">
          {storesQuery.isLoading ? (
            <p className="sede-picker__empty">Cargando catálogo…</p>
          ) : filtered.length === 0 ? (
            <p className="sede-picker__empty">Sin coincidencias para "{search}"</p>
          ) : (
            filtered.map((store) => {
              const isCurrent = store.storeId === currentStoreId;
              return (
                <button
                  key={store.storeId}
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  className={`sede-row ${isCurrent ? 'sede-row--current' : ''}`}
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(store.storeId)}
                >
                  <span className="sede-row__icon" aria-hidden>
                    <MapPin size={16} />
                  </span>
                  <span className="sede-row__copy">
                    <strong>{store.name}</strong>
                    <small>{store.city} · {store.storeId}</small>
                  </span>
                  {isCurrent ? (
                    <span className="sede-row__current-badge" aria-label="Sede actual">
                      <Check size={14} aria-hidden /> Actual
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div className="dialog__actions">
          <button type="button" className="button button--ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </button>
          {mutation.isPending ? (
            <span className="dialog__pending">
              <Loader2 size={14} className="spin" aria-hidden /> Activando sede…
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
