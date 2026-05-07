/**
 * Productos del inventario activo.
 *
 * UI orientada a operación, no marketing:
 *  - Form compacto inline para agregar productos del catálogo
 *  - Tabla con edición inline (stockInicial / mín / máx / lead time)
 *  - Toasts en éxito y error, ConfirmDialog al quitar
 *  - Manejo de versionado optimista (CONFLICT 409 → toast accionable)
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Search, Trash2, Save, Pencil, X, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getCatalogProducts } from '../shared/api/catalogApi';
import { getInventoryProducts, getState, putInventoryProducts } from '../shared/api/inventoryApi';
import type { InventoryProduct, InventoryProductInput } from '../shared/api/contracts';
import { ApiError } from '../shared/api/httpClient';
import { StatusBadge } from '../shared/components/StatusBadge';
import { useToast } from '../shared/components/ui/Toast';
import { SkeletonRows } from '../shared/components/ui/Skeleton';
import { ConfirmDialog } from '../shared/components/ui/ConfirmDialog';
import { Pagination, paginate } from '../shared/components/ui/Pagination';
import { EmptyState } from '../shared/components/ui/EmptyState';
import { getApiErrorMessage } from '../shared/lib/getApiErrorMessage';
import { productFormSchema, type ProductFormValues } from '../shared/lib/inventorySchemas';

const PAGE_SIZE = 8;

const toInputShape = (p: InventoryProduct): InventoryProductInput => ({
  productId: p.productId,
  nombre: p.nombre,
  categoria: p.categoria,
  providerId: p.providerId,
  stockInicial: p.stockInicial,
  stockMinimo: p.stockMinimo,
  stockMaximo: p.stockMaximo,
  leadTimeReposicion: p.leadTimeReposicion
});

interface InlineEdit {
  productId: string;
  stockInicial: string;
  stockMinimo: string;
  stockMaximo: string;
  leadTimeReposicion: string;
}

const toEditShape = (p: InventoryProduct): InlineEdit => ({
  productId: p.productId,
  stockInicial: p.stockInicial != null ? String(p.stockInicial) : '',
  stockMinimo: p.stockMinimo != null ? String(p.stockMinimo) : '',
  stockMaximo: p.stockMaximo != null ? String(p.stockMaximo) : '',
  leadTimeReposicion: p.leadTimeReposicion != null ? String(p.leadTimeReposicion) : ''
});

const parseNullableInt = (raw: string): number | null => {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 0 ? n : null;
};

export function InventoryProductsPage() {
  const { inventoryId = '' } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<InlineEdit | null>(null);
  const [removeTarget, setRemoveTarget] = useState<InventoryProduct | null>(null);

  const productsQuery = useQuery({
    queryKey: ['inventory-products', inventoryId],
    queryFn: () => getInventoryProducts(inventoryId),
    enabled: Boolean(inventoryId)
  });
  const stateQuery = useQuery({
    queryKey: ['inventory-state', inventoryId],
    queryFn: () => getState(inventoryId),
    enabled: Boolean(inventoryId)
  });
  const catalogQuery = useQuery({
    queryKey: ['catalog-products'],
    queryFn: getCatalogProducts
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productId: '',
      stockInicial: null,
      stockMinimo: null,
      stockMaximo: null,
      leadTimeReposicion: null
    }
  });

  const products = productsQuery.data?.data ?? [];
  const catalog = catalogQuery.data?.data ?? [];
  const inventoryVersion = stateQuery.data?.data.inventory.version ?? 1;

  const availableCatalog = useMemo(() => {
    const taken = new Set(products.map((p) => p.productId));
    return catalog.filter((p) => !taken.has(p.productId));
  }, [catalog, products]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(needle) ||
        p.productId.toLowerCase().includes(needle) ||
        p.categoria.toLowerCase().includes(needle)
    );
  }, [products, search]);

  const completeProducts = products.filter((p) => p.estadoValidacion === 'complete').length;
  const incompleteProducts = products.length - completeProducts;

  const inventoryErrorMessage =
    productsQuery.error instanceof Error ? productsQuery.error.message : '';
  const isMissingInventory =
    productsQuery.error instanceof ApiError &&
    (productsQuery.error.status === 404 ||
      productsQuery.error.code === 'NOT_FOUND' ||
      inventoryErrorMessage.includes('Inventory not found'));

  const upsertMutation = useMutation({
    mutationFn: (next: InventoryProductInput[]) =>
      putInventoryProducts(inventoryId, next, inventoryVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products', inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-state', inventoryId] });
    }
  });

  useEffect(() => {
    if (isMissingInventory) {
      sessionStorage.removeItem('activeInventoryId');
      sessionStorage.removeItem('activeStoreId');
    }
  }, [isMissingInventory]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, page]);

  const onAddProduct = form.handleSubmit(async (values) => {
    const catalogProduct = catalog.find((c) => c.productId === values.productId);
    if (!catalogProduct) return;
    if (products.some((p) => p.productId === values.productId)) {
      toast.warning('Producto ya registrado', 'Edita el existente en su lugar.');
      return;
    }

    const next: InventoryProductInput[] = [
      ...products.map(toInputShape),
      {
        productId: catalogProduct.productId,
        nombre: catalogProduct.name,
        categoria: catalogProduct.category,
        providerId: catalogProduct.providerId,
        stockInicial: values.stockInicial ?? catalogProduct.stockInicial ?? null,
        stockMinimo: values.stockMinimo ?? null,
        stockMaximo: values.stockMaximo ?? null,
        leadTimeReposicion: values.leadTimeReposicion ?? null
      }
    ];

    try {
      await upsertMutation.mutateAsync(next);
      const incomplete = next[next.length - 1]?.stockInicial == null;
      toast.success(
        incomplete ? 'Producto agregado (incompleto)' : 'Producto agregado',
        incomplete
          ? 'Falta stock inicial: aparecerá una alerta sin bloquear el flujo.'
          : `${catalogProduct.name} se agregó al inventario.`
      );
      form.reset();
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message.title, message.description);
    }
  });

  async function commitInlineEdit() {
    if (!editing) return;
    const next: InventoryProductInput[] = products.map((p) => {
      if (p.productId !== editing.productId) return toInputShape(p);
      return {
        productId: p.productId,
        nombre: p.nombre,
        categoria: p.categoria,
        providerId: p.providerId,
        stockInicial: parseNullableInt(editing.stockInicial),
        stockMinimo: parseNullableInt(editing.stockMinimo),
        stockMaximo: parseNullableInt(editing.stockMaximo),
        leadTimeReposicion: parseNullableInt(editing.leadTimeReposicion)
      };
    });
    try {
      await upsertMutation.mutateAsync(next);
      toast.success('Producto actualizado');
      setEditing(null);
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message.title, message.description);
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    try {
      const next = products
        .filter((p) => p.productId !== removeTarget.productId)
        .map(toInputShape);
      await upsertMutation.mutateAsync(next);
      toast.success('Producto removido', removeTarget.nombre);
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message.title, message.description);
    } finally {
      setRemoveTarget(null);
    }
  }

  if (isMissingInventory) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <h1>Inventario no disponible</h1>
            <p className="page-header__sub">
              El inventario en memoria fue reciclado. Selecciona una sede de nuevo.
            </p>
          </div>
        </header>
        <section className="card">
          <EmptyState
            title="Sesión segura"
            description="No se perdió la sesión. Solo necesitas activar una sede para volver a operar."
            action={
              <Link className="button" to="/inventario">
                Ir al resumen
              </Link>
            }
          />
        </section>
      </div>
    );
  }

  const visible = paginate(filtered, page, PAGE_SIZE);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Productos</h1>
          <p className="page-header__sub">
            Catálogo operativo del inventario activo. Edita stock mínimo / máximo y lead time
            haciendo click en <em>Editar</em> en cada fila.
          </p>
        </div>
        <div className="page-header__stats">
          <span><strong>{products.length}</strong> total</span>
          <span className="page-header__stats--ok"><strong>{completeProducts}</strong> completos</span>
          <span className="page-header__stats--warn"><strong>{incompleteProducts}</strong> incompletos</span>
        </div>
      </header>

      {/* Form alta — compacto, una línea */}
      <section className="card card--form">
        <header className="card__header card__header--tight">
          <h2><Plus size={14} aria-hidden /> Agregar producto</h2>
          <small>Si dejas <em>stock inicial</em> vacío, el producto queda <strong>incompleto</strong> y genera alerta sin bloquear.</small>
        </header>
        <form className="form-row" onSubmit={onAddProduct} noValidate>
          <label htmlFor="productId" className="form-row__field form-row__field--grow">
            <span>Producto</span>
            <select
              id="productId"
              aria-invalid={!!form.formState.errors.productId}
              {...form.register('productId')}
            >
              <option value="">Selecciona del catálogo…</option>
              {availableCatalog.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.name} · {p.category}
                </option>
              ))}
            </select>
            {form.formState.errors.productId ? (
              <small className="field-error" role="alert">
                {form.formState.errors.productId.message}
              </small>
            ) : null}
          </label>
          <label htmlFor="stockInicial" className="form-row__field">
            <span>Stock inicial</span>
            <input id="stockInicial" type="number" min={0} placeholder="vacío" {...form.register('stockInicial')} />
          </label>
          <label htmlFor="stockMinimo" className="form-row__field">
            <span>Mínimo</span>
            <input id="stockMinimo" type="number" min={0} {...form.register('stockMinimo')} />
          </label>
          <label htmlFor="stockMaximo" className="form-row__field">
            <span>Máximo</span>
            <input id="stockMaximo" type="number" min={0} {...form.register('stockMaximo')} />
          </label>
          <label htmlFor="leadTimeReposicion" className="form-row__field">
            <span>Lead time (d)</span>
            <input id="leadTimeReposicion" type="number" min={0} {...form.register('leadTimeReposicion')} />
          </label>
          <button className="button" type="submit" disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? 'Guardando…' : 'Agregar'}
          </button>
        </form>
      </section>

      {/* Tabla con edición inline */}
      <section className="card">
        <header className="card__header card__header--tight">
          <h2>Productos registrados</h2>
          <div className="filter-bar filter-bar--inline">
            <Search size={14} aria-hidden />
            <input
              id="product-search"
              type="search"
              placeholder="Buscar…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar productos"
            />
          </div>
        </header>

        {productsQuery.isLoading ? (
          <SkeletonRows count={4} />
        ) : products.length === 0 ? (
          <EmptyState
            title="Aún no hay productos"
            description="Agrega un producto del catálogo en el formulario de arriba."
          />
        ) : (
          <>
            <table className="table table--compact">
              <caption className="visually-hidden">Productos registrados</caption>
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Inicial</th>
                  <th scope="col">Disponible</th>
                  <th scope="col">Reservado</th>
                  <th scope="col">Mín / Máx</th>
                  <th scope="col">Lead</th>
                  <th scope="col">Estado</th>
                  <th scope="col" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => {
                  const isEditing = editing?.productId === product.productId;
                  return (
                    <tr key={product.productId} className={isEditing ? 'row-editing' : ''}>
                      <td>
                        <div className="row-title">{product.nombre}</div>
                        <small><code>{product.productId}</code></small>
                      </td>
                      <td>{product.categoria}</td>
                      <td>
                        {isEditing ? (
                          <input
                            className="cell-input"
                            type="number"
                            min={0}
                            value={editing.stockInicial}
                            placeholder="—"
                            onChange={(event) => setEditing({ ...editing, stockInicial: event.target.value })}
                            aria-label="Stock inicial"
                          />
                        ) : product.stockInicial ?? <span className="muted">—</span>}
                      </td>
                      <td>{product.stockDisponible ?? <span className="muted">—</span>}</td>
                      <td>{product.stockReservado ?? 0}</td>
                      <td>
                        {isEditing ? (
                          <span className="cell-pair">
                            <input
                              className="cell-input"
                              type="number"
                              min={0}
                              value={editing.stockMinimo}
                              onChange={(event) => setEditing({ ...editing, stockMinimo: event.target.value })}
                              aria-label="Stock mínimo"
                            />
                            <span aria-hidden>/</span>
                            <input
                              className="cell-input"
                              type="number"
                              min={0}
                              value={editing.stockMaximo}
                              onChange={(event) => setEditing({ ...editing, stockMaximo: event.target.value })}
                              aria-label="Stock máximo"
                            />
                          </span>
                        ) : (
                          `${product.stockMinimo ?? '—'} / ${product.stockMaximo ?? '—'}`
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="cell-input"
                            type="number"
                            min={0}
                            value={editing.leadTimeReposicion}
                            onChange={(event) => setEditing({ ...editing, leadTimeReposicion: event.target.value })}
                            aria-label="Lead time"
                          />
                        ) : product.leadTimeReposicion ?? <span className="muted">—</span>}
                      </td>
                      <td>
                        <StatusBadge tone={product.estadoValidacion === 'complete' ? 'default' : 'warn'}>
                          {product.estadoValidacion === 'complete' ? 'Completo' : 'Incompleto'}
                        </StatusBadge>
                      </td>
                      <td className="cell-actions">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="button button--sm"
                              aria-label="Guardar cambios"
                              disabled={upsertMutation.isPending}
                              onClick={commitInlineEdit}
                            >
                              <Save size={14} aria-hidden /> Guardar
                            </button>
                            <button
                              type="button"
                              className="button button--ghost button--sm"
                              aria-label="Cancelar edición"
                              onClick={() => setEditing(null)}
                            >
                              <X size={14} aria-hidden />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="button button--ghost button--sm"
                              aria-label={`Editar ${product.nombre}`}
                              onClick={() => setEditing(toEditShape(product))}
                            >
                              <Pencil size={14} aria-hidden /> Editar
                            </button>
                            <button
                              type="button"
                              className="button button--ghost button--sm"
                              aria-label={`Quitar ${product.nombre}`}
                              onClick={() => setRemoveTarget(product)}
                            >
                              <Trash2 size={14} aria-hidden />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
        open={removeTarget !== null}
        title={`Quitar ${removeTarget?.nombre ?? ''}`}
        description="El producto saldrá del inventario y se recalcularán alertas y sugerencias. Los movimientos asociados quedarán huérfanos."
        confirmLabel="Quitar producto"
        tone="danger"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        isPending={upsertMutation.isPending}
      />
    </div>
  );
}
