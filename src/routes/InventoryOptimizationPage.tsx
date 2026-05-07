/**
 * Optimización del inventario activo. Densa, sin marketing.
 */

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { getState, getSummary, optimizeInventory } from '../shared/api/inventoryApi';
import { useToast } from '../shared/components/ui/Toast';
import { Skeleton, SkeletonRows } from '../shared/components/ui/Skeleton';
import { EmptyState } from '../shared/components/ui/EmptyState';
import { getApiErrorMessage } from '../shared/lib/getApiErrorMessage';

export function InventoryOptimizationPage() {
  const { inventoryId = '' } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const summaryQuery = useQuery({
    queryKey: ['summary', inventoryId],
    queryFn: () => getSummary(inventoryId),
    enabled: Boolean(inventoryId)
  });
  const stateQuery = useQuery({
    queryKey: ['inventory-state', inventoryId],
    queryFn: () => getState(inventoryId),
    enabled: Boolean(inventoryId)
  });

  const mutation = useMutation({
    mutationFn: () => optimizeInventory(inventoryId),
    onSuccess(response) {
      queryClient.invalidateQueries({ queryKey: ['summary', inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-state', inventoryId] });
      const total = response.data.suggestions.length;
      toast.success(
        'Optimización ejecutada',
        total === 0 ? 'No hay productos por reponer.' : `${total} sugerencia(s) generadas.`
      );
    },
    onError(error) {
      const msg = getApiErrorMessage(error);
      toast.error(msg.title, msg.description);
    }
  });

  const summary = mutation.data?.data.summary ?? summaryQuery.data?.data;
  const state = mutation.data?.data ?? stateQuery.data?.data;
  const suggestions = state?.suggestions ?? [];
  const productNames = useMemo(
    () => new Map((state?.products ?? []).map((p) => [p.productId, p.nombre])),
    [state?.products]
  );

  const isPreparing = stateQuery.isLoading || mutation.isPending;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Optimización</h1>
          <p className="page-header__sub">
            Recalcula stock proyectado y produce sugerencias de reposición usando movimientos cronológicos.
          </p>
        </div>
        <div className="page-header__stats">
          <span><strong>{summaryQuery.isLoading && !summary ? <Skeleton width={20} variant="text" /> : summary?.stockTotal ?? '—'}</strong> stock total</span>
          <span><strong>{summaryQuery.isLoading && !summary ? <Skeleton width={20} variant="text" /> : summary?.totalProductos ?? '—'}</strong> productos</span>
          <span className="page-header__stats--warn"><strong>{summaryQuery.isLoading && !summary ? <Skeleton width={20} variant="text" /> : summary?.totalAlertas ?? '—'}</strong> alertas</span>
          <span className="page-header__stats--ok"><strong>{summaryQuery.isLoading && !summary ? <Skeleton width={20} variant="text" /> : summary?.totalSugerencias ?? '—'}</strong> sugerencias</span>
        </div>
      </header>

      <section className="card card--form">
        <header className="card__header card__header--tight">
          <h2><PackageSearch size={14} aria-hidden /> Ejecutar optimización</h2>
          <small>Estado: <strong>{mutation.isSuccess ? 'actualizada' : 'pendiente'}</strong></small>
        </header>
        <div className="card__body">
          <button
            className="button"
            onClick={() => mutation.mutate()}
            type="button"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Calculando…' : 'Ejecutar ahora'}
          </button>
        </div>
      </section>

      <section className="card">
        <header className="card__header card__header--tight">
          <h2>Sugerencias de reposición</h2>
          <small>{suggestions.length} acciones</small>
        </header>
        {isPreparing ? (
          <SkeletonRows count={4} />
        ) : suggestions.length === 0 ? (
          <EmptyState
            title="Sin sugerencias activas"
            description="Ejecuta la optimización después de registrar movimientos para ver acciones de reposición."
          />
        ) : (
          <table className="table table--compact">
            <caption className="visually-hidden">Sugerencias de reposición</caption>
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Cantidad sugerida</th>
                <th scope="col">Punto reorden</th>
                <th scope="col">Lote económico</th>
                <th scope="col">Razón</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion) => (
                <tr key={suggestion.suggestionId}>
                  <td>
                    <div className="row-title">
                      {productNames.get(suggestion.productId) ?? suggestion.productId}
                    </div>
                    <small><code>{suggestion.productId}</code></small>
                  </td>
                  <td><strong>{suggestion.cantidadSugerida}</strong></td>
                  <td>{suggestion.puntoReorden}</td>
                  <td>{suggestion.loteEconomico}</td>
                  <td>{suggestion.razon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
