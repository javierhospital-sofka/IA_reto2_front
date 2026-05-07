/**
 * Movimientos del inventario activo.
 *
 * Form compacto en una línea, bitácora densa con edición y anulación.
 * Versionado optimista en cada mutación (incluye `expectedVersion`).
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Pencil, Plus, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createMovement,
  getInventoryProducts,
  getMovements,
  getState,
  patchMovement
} from '../shared/api/inventoryApi';
import type { Movement, MovementType } from '../shared/api/contracts';
import { StatusBadge } from '../shared/components/StatusBadge';
import { useToast } from '../shared/components/ui/Toast';
import { SkeletonRows } from '../shared/components/ui/Skeleton';
import { ConfirmDialog } from '../shared/components/ui/ConfirmDialog';
import { Pagination, paginate } from '../shared/components/ui/Pagination';
import { EmptyState } from '../shared/components/ui/EmptyState';
import { getApiErrorMessage } from '../shared/lib/getApiErrorMessage';
import { movementFormSchema, type MovementFormValues } from '../shared/lib/inventorySchemas';

const PAGE_SIZE = 12;
const MOVEMENT_TYPES: MovementType[] = ['entrada', 'salida', 'ajuste', 'reserva', 'liberacion'];

export function InventoryMovementsPage() {
  const { inventoryId = '' } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [filterType, setFilterType] = useState<'all' | MovementType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Movement | null>(null);
  const [editValues, setEditValues] = useState({ cantidad: 0 });
  const [voidTarget, setVoidTarget] = useState<Movement | null>(null);

  const productsQuery = useQuery({
    queryKey: ['inventory-products', inventoryId],
    queryFn: () => getInventoryProducts(inventoryId)
  });
  const movementsQuery = useQuery({
    queryKey: ['movements', inventoryId],
    queryFn: () => getMovements(inventoryId)
  });
  const stateQuery = useQuery({
    queryKey: ['inventory-state', inventoryId],
    queryFn: () => getState(inventoryId)
  });

  const products = productsQuery.data?.data ?? [];
  const inventoryVersion = stateQuery.data?.data.inventory.version ?? 1;

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      productId: '',
      tipoMovimiento: 'entrada',
      cantidad: 1,
      origen: 'web',
      destino: 'store'
    }
  });

  const movements = useMemo(
    () =>
      [...(movementsQuery.data?.data ?? [])].sort(
        (a, b) =>
          new Date(b.fechaMovimiento).getTime() - new Date(a.fechaMovimiento).getTime()
      ),
    [movementsQuery.data?.data]
  );

  const productNames = useMemo(
    () => new Map(products.map((p) => [p.productId, p.nombre])),
    [products]
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return movements.filter((m) => {
      if (filterType !== 'all' && m.tipoMovimiento !== filterType) return false;
      if (!needle) return true;
      const label = (productNames.get(m.productId) ?? m.productId).toLowerCase();
      return label.includes(needle) || m.movementId.toLowerCase().includes(needle);
    });
  }, [movements, filterType, search, productNames]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, page]);

  const entradas = movements.filter((m) => m.tipoMovimiento === 'entrada').length;
  const salidas = movements.filter((m) => m.tipoMovimiento === 'salida').length;
  const ajustes = movements.filter((m) => m.tipoMovimiento === 'ajuste').length;

  const createMutation = useMutation({
    mutationFn: (values: MovementFormValues) =>
      createMovement(inventoryId, {
        ...values,
        fechaMovimiento: new Date().toISOString(),
        expectedVersion: inventoryVersion
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements', inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products', inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-state', inventoryId] });
    }
  });

  const patchMutation = useMutation({
    mutationFn: (input: { movementId: string; cantidad: number; estado?: 'editado' | 'anulado' }) =>
      patchMovement(inventoryId, input.movementId, {
        cantidad: input.cantidad,
        estado: input.estado,
        expectedVersion: inventoryVersion
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements', inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products', inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-state', inventoryId] });
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      toast.success(
        'Movimiento registrado',
        `${values.tipoMovimiento} · ${values.cantidad} u · ${productNames.get(values.productId) ?? values.productId}`
      );
      form.reset({
        productId: values.productId,
        tipoMovimiento: 'entrada',
        cantidad: 1,
        origen: 'web',
        destino: 'store'
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message.title, message.description);
    }
  });

  function startEdit(movement: Movement) {
    setEditing(movement);
    setEditValues({ cantidad: movement.cantidad });
  }

  async function commitEdit() {
    if (!editing) return;
    try {
      await patchMutation.mutateAsync({
        movementId: editing.movementId,
        cantidad: editValues.cantidad
      });
      toast.success('Movimiento actualizado', `Cantidad: ${editValues.cantidad}`);
      setEditing(null);
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message.title, message.description);
    }
  }

  async function commitVoid() {
    if (!voidTarget) return;
    try {
      await patchMutation.mutateAsync({
        movementId: voidTarget.movementId,
        cantidad: voidTarget.cantidad,
        estado: 'anulado'
      });
      toast.success('Movimiento anulado', 'No participará en el cálculo de stock.');
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message.title, message.description);
    } finally {
      setVoidTarget(null);
    }
  }

  const visible = paginate(filtered, page, PAGE_SIZE);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Movimientos</h1>
          <p className="page-header__sub">
            Bitácora cronológica del inventario activo. Editar y anular respetan el versionado optimista.
          </p>
        </div>
        <div className="page-header__stats">
          <span><strong>{movements.length}</strong> total</span>
          <span className="page-header__stats--ok"><strong>{entradas}</strong> entradas</span>
          <span className="page-header__stats--warn"><strong>{salidas}</strong> salidas</span>
          <span><strong>{ajustes}</strong> ajustes</span>
        </div>
      </header>

      {/* Form alta — una línea */}
      <section className="card card--form">
        <header className="card__header card__header--tight">
          <h2><Plus size={14} aria-hidden /> Registrar movimiento</h2>
          <small>El backend recalcula stock disponible, reservado y proyectado al guardar.</small>
        </header>
        <form className="form-row" onSubmit={onSubmit} noValidate>
          <label htmlFor="m-productId" className="form-row__field form-row__field--grow">
            <span>Producto</span>
            <select
              id="m-productId"
              aria-invalid={!!form.formState.errors.productId}
              {...form.register('productId')}
            >
              <option value="">Selecciona…</option>
              {products.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.nombre}
                </option>
              ))}
            </select>
            {form.formState.errors.productId ? (
              <small className="field-error" role="alert">
                {form.formState.errors.productId.message}
              </small>
            ) : null}
          </label>
          <label htmlFor="m-tipo" className="form-row__field">
            <span>Tipo</span>
            <select id="m-tipo" {...form.register('tipoMovimiento')}>
              {MOVEMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="m-cantidad" className="form-row__field">
            <span>Cantidad</span>
            <input
              id="m-cantidad"
              type="number"
              min={1}
              aria-invalid={!!form.formState.errors.cantidad}
              {...form.register('cantidad')}
            />
            {form.formState.errors.cantidad ? (
              <small className="field-error" role="alert">
                {form.formState.errors.cantidad.message}
              </small>
            ) : null}
          </label>
          <label htmlFor="m-origen" className="form-row__field">
            <span>Origen</span>
            <input id="m-origen" {...form.register('origen')} />
          </label>
          <label htmlFor="m-destino" className="form-row__field">
            <span>Destino</span>
            <input id="m-destino" {...form.register('destino')} />
          </label>
          <button className="button" disabled={createMutation.isPending} type="submit">
            {createMutation.isPending ? 'Registrando…' : 'Registrar'}
          </button>
        </form>
      </section>

      {/* Tabla */}
      <section className="card">
        <header className="card__header card__header--tight">
          <h2>Bitácora</h2>
          <div className="filter-bar filter-bar--inline">
            <Search size={14} aria-hidden />
            <input
              id="movement-search"
              type="search"
              placeholder="Buscar por producto o ID…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar movimientos"
            />
            <label htmlFor="movement-filter" className="visually-hidden">
              Filtrar por tipo
            </label>
            <select
              id="movement-filter"
              value={filterType}
              onChange={(event) => setFilterType(event.target.value as MovementType | 'all')}
            >
              <option value="all">Todos los tipos</option>
              {MOVEMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </header>

        {movementsQuery.isLoading ? (
          <SkeletonRows count={5} />
        ) : movements.length === 0 ? (
          <EmptyState
            title="Aún no hay movimientos"
            description="Registra una entrada o ajuste para iniciar la bitácora."
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin coincidencias" description="Prueba con otro término o filtro." />
        ) : (
          <>
            <table className="table table--compact">
              <caption className="visually-hidden">Movimientos cronológicos</caption>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Producto</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col">Estado</th>
                  <th scope="col" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {visible.map((movement) => (
                  <tr key={movement.movementId}>
                    <td>{new Date(movement.fechaMovimiento).toLocaleString()}</td>
                    <td>
                      <div className="row-title">
                        {productNames.get(movement.productId) ?? movement.productId}
                      </div>
                      <small><code>{movement.movementId}</code></small>
                    </td>
                    <td>
                      <span className={`movement-type movement-type--${movement.tipoMovimiento}`}>
                        {movement.tipoMovimiento}
                      </span>
                    </td>
                    <td><strong>{movement.cantidad}</strong></td>
                    <td>
                      <StatusBadge tone={movement.estado === 'anulado' ? 'warn' : 'default'}>
                        {movement.estado}
                      </StatusBadge>
                    </td>
                    <td className="cell-actions">
                      <button
                        type="button"
                        className="button button--ghost button--sm"
                        aria-label={`Editar movimiento ${movement.movementId}`}
                        disabled={movement.estado === 'anulado'}
                        onClick={() => startEdit(movement)}
                      >
                        <Pencil size={14} aria-hidden /> Editar
                      </button>
                      <button
                        type="button"
                        className="button button--ghost button--sm"
                        aria-label={`Anular movimiento ${movement.movementId}`}
                        disabled={movement.estado === 'anulado'}
                        onClick={() => setVoidTarget(movement)}
                      >
                        Anular
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <ConfirmDialog
        open={editing !== null}
        title="Editar movimiento"
        description={
          editing ? (
            <div className="dialog-form">
              <p>
                <strong>{productNames.get(editing.productId) ?? editing.productId}</strong> ·{' '}
                {editing.tipoMovimiento}
              </p>
              <label htmlFor="edit-cantidad">
                Nueva cantidad
                <input
                  id="edit-cantidad"
                  type="number"
                  min={1}
                  value={editValues.cantidad}
                  onChange={(event) =>
                    setEditValues({ cantidad: Number(event.target.value) || 0 })
                  }
                />
              </label>
            </div>
          ) : null
        }
        confirmLabel="Guardar cambios"
        onCancel={() => setEditing(null)}
        onConfirm={commitEdit}
        isPending={patchMutation.isPending}
      />

      <ConfirmDialog
        open={voidTarget !== null}
        title="Anular movimiento"
        description="El movimiento dejará de aplicarse al cálculo cronológico de stock."
        confirmLabel="Anular"
        tone="danger"
        onCancel={() => setVoidTarget(null)}
        onConfirm={commitVoid}
        isPending={patchMutation.isPending}
      />
    </div>
  );
}
