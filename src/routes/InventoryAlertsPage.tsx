/**
 * Alertas del inventario activo. Bandeja densa con filtros por severidad.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { getState } from '../shared/api/inventoryApi';
import { StatusBadge } from '../shared/components/StatusBadge';
import { Skeleton, SkeletonRows } from '../shared/components/ui/Skeleton';
import { EmptyState } from '../shared/components/ui/EmptyState';
import { Pagination, paginate } from '../shared/components/ui/Pagination';

const PAGE_SIZE = 10;

type Severity = 'all' | 'critical' | 'warning' | 'info';

const FILTERS: Array<[Severity, string]> = [
  ['all', 'Todas'],
  ['critical', 'Críticas'],
  ['warning', 'Advertencias'],
  ['info', 'Info']
];

export function InventoryAlertsPage() {
  const { inventoryId = '' } = useParams();
  const [severityFilter, setSeverityFilter] = useState<Severity>('all');
  const [page, setPage] = useState(1);

  const stateQuery = useQuery({
    queryKey: ['inventory-state', inventoryId],
    queryFn: () => getState(inventoryId),
    enabled: Boolean(inventoryId)
  });

  const alerts = stateQuery.data?.data.alerts ?? [];
  const filteredAlerts = useMemo(
    () =>
      severityFilter === 'all'
        ? alerts
        : alerts.filter((alert) => alert.severidad === severityFilter),
    [alerts, severityFilter]
  );

  const counts = useMemo(
    () => ({
      critical: alerts.filter((a) => a.severidad === 'critical').length,
      warning: alerts.filter((a) => a.severidad === 'warning').length,
      info: alerts.filter((a) => a.severidad === 'info').length
    }),
    [alerts]
  );

  const visible = paginate(filteredAlerts, page, PAGE_SIZE);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Alertas</h1>
          <p className="page-header__sub">
            Riesgos de stock, productos incompletos y señales que requieren seguimiento.
          </p>
        </div>
        <div className="page-header__stats">
          <span className="page-header__stats--danger">
            <strong>{stateQuery.isLoading ? <Skeleton width={20} variant="text" /> : counts.critical}</strong> críticas
          </span>
          <span className="page-header__stats--warn">
            <strong>{stateQuery.isLoading ? <Skeleton width={20} variant="text" /> : counts.warning}</strong> warnings
          </span>
          <span className="page-header__stats--ok">
            <strong>{stateQuery.isLoading ? <Skeleton width={20} variant="text" /> : counts.info}</strong> info
          </span>
        </div>
      </header>

      <section className="card">
        <header className="card__header card__header--tight">
          <h2>Bandeja</h2>
          <div className="filter-tabs" role="tablist" aria-label="Filtrar alertas">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={severityFilter === value}
                className={severityFilter === value ? 'active' : ''}
                onClick={() => {
                  setSeverityFilter(value);
                  setPage(1);
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {stateQuery.isLoading ? (
          <SkeletonRows count={4} />
        ) : filteredAlerts.length === 0 ? (
          <EmptyState
            title="Todo en orden"
            description="No hay alertas para el filtro seleccionado."
            icon={<CheckCircle2 size={28} />}
          />
        ) : (
          <>
            <table className="table table--compact">
              <caption className="visually-hidden">Alertas activas</caption>
              <thead>
                <tr>
                  <th scope="col">Severidad</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Producto</th>
                  <th scope="col">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((alert) => (
                  <tr key={alert.alertId}>
                    <td>
                      <StatusBadge
                        tone={
                          alert.severidad === 'critical'
                            ? 'danger'
                            : alert.severidad === 'warning'
                              ? 'warn'
                              : 'default'
                        }
                      >
                        {alert.severidad}
                      </StatusBadge>
                    </td>
                    <td><code>{alert.tipo}</code></td>
                    <td>{alert.productId ?? <span className="muted">—</span>}</td>
                    <td>{alert.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={filteredAlerts.length}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
