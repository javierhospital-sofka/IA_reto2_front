/**
 * Resumen / Dashboard global con gráficas reales (recharts).
 *
 * Layout:
 *   - 6 KPI cards (totales)
 *   - 4 charts: bar horizontal (top stock por tienda), donut (movs por tipo),
 *     area (movs por día, 30d), donut (alertas por severidad)
 *   - Tabla de inventarios (click → activar sede)
 *   - Bandeja de movimientos recientes + alertas activas
 *
 * El backend hace auto-seed al arrancar; el dashboard nunca está vacío.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts';
import { AlertTriangle, MapPin, Search, TrendingDown, TrendingUp } from 'lucide-react';
import {
  getDashboard,
  type DashboardInventoryView
} from '../shared/api/inventoryApi';
import { getStores } from '../shared/api/catalogApi';
import { Skeleton, SkeletonRows } from '../shared/components/ui/Skeleton';
import { EmptyState } from '../shared/components/ui/EmptyState';
import { StatusBadge } from '../shared/components/StatusBadge';
import { Pagination, paginate } from '../shared/components/ui/Pagination';
import { SystemStatus } from '../shared/components/SystemStatus';

const PAGE_SIZE = 8;

const TYPE_COLORS: Record<string, string> = {
  entrada: '#059669',
  salida: '#dc2626',
  ajuste: '#3730a3',
  reserva: '#d97706',
  liberacion: '#7c3aed'
};
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  warning: '#d97706',
  info: '#2563eb'
};

export function InventoryHomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchOnWindowFocus: false,
    refetchInterval: 30_000
  });

  const storesQuery = useQuery({
    queryKey: ['stores'],
    queryFn: getStores,
    staleTime: 60_000
  });

  const dashboard = dashboardQuery.data?.data;
  const stores = storesQuery.data?.data ?? [];
  const charts = dashboard?.charts;
  const totals = dashboard?.totals;

  const storeName = useMemo(
    () => new Map(stores.map((s) => [s.storeId, s])),
    [stores]
  );

  const filteredInventories = useMemo(() => {
    const list = dashboard?.inventories ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((inv) => {
      const store = storeName.get(inv.storeId);
      return (
        inv.storeId.toLowerCase().includes(needle) ||
        inv.inventoryId.toLowerCase().includes(needle) ||
        store?.name.toLowerCase().includes(needle) ||
        store?.city.toLowerCase().includes(needle)
      );
    });
  }, [dashboard?.inventories, search, storeName]);

  const visible = paginate(filteredInventories, page, PAGE_SIZE);

  const movementsByTypeData = useMemo(() => {
    if (!charts) return [];
    return Object.entries(charts.movementsByType)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({ name: type, value: count }));
  }, [charts]);

  const alertsBySeverityData = useMemo(() => {
    if (!charts) return [];
    return Object.entries(charts.alertsBySeverity)
      .filter(([, count]) => count > 0)
      .map(([sev, count]) => ({ name: sev, value: count }));
  }, [charts]);

  const movementsByDayData = useMemo(() => {
    if (!charts) return [];
    return charts.movementsByDay.map((d) => ({
      date: d.date.slice(5),
      count: d.count
    }));
  }, [charts]);

  const topInventoriesData = useMemo(() => {
    if (!charts) return [];
    return charts.topInventoriesByStock.map((inv) => ({
      name: storeName.get(inv.storeId)?.name ?? inv.storeId,
      stock: inv.stockTotal,
      alerts: inv.alertCount
    }));
  }, [charts, storeName]);

  function activate(inv: DashboardInventoryView) {
    sessionStorage.setItem('activeInventoryId', inv.inventoryId);
    sessionStorage.setItem('activeStoreId', inv.storeId);
    navigate(`/inventories/${inv.inventoryId}/products`);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Resumen</h1>
          <p className="page-header__sub">
            Estado consolidado del sistema. Click en cualquier inventario para activarlo como sede.
            Los datos se actualizan automáticamente cada 30 segundos.
          </p>
        </div>
      </header>

      <section className="kpi-strip">
        <KpiCard label="Inventarios" value={totals?.inventoryCount} loading={dashboardQuery.isLoading} />
        <KpiCard label="Productos" value={totals?.productCount} loading={dashboardQuery.isLoading} />
        <KpiCard label="Stock total" value={totals?.stockTotal} loading={dashboardQuery.isLoading} />
        <KpiCard label="Movimientos" value={totals?.movementCount} loading={dashboardQuery.isLoading} />
        <KpiCard
          label="Alertas"
          tone="warn"
          value={totals?.alertCount}
          extra={totals?.criticalAlerts ? `${totals.criticalAlerts} críticas` : undefined}
          loading={dashboardQuery.isLoading}
        />
        <KpiCard label="Sugerencias" tone="ok" value={totals?.suggestionCount} loading={dashboardQuery.isLoading} />
      </section>

      <section className="charts-grid">
        <ChartCard title="Top tiendas por stock" subtitle="Top 10 inventarios">
          {dashboardQuery.isLoading ? (
            <Skeleton height={220} />
          ) : topInventoriesData.length === 0 ? (
            <EmptyState title="Sin datos" description="No hay inventarios para graficar." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={topInventoriesData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  width={120}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(15, 118, 110, 0.06)' }}
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                />
                <Bar dataKey="stock" fill="#0f766e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Movimientos por tipo" subtitle="Distribución total">
          {dashboardQuery.isLoading ? (
            <Skeleton height={220} />
          ) : movementsByTypeData.length === 0 ? (
            <EmptyState title="Sin movimientos" description="No hay movimientos registrados." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={movementsByTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {movementsByTypeData.map((entry) => (
                    <Cell key={entry.name} fill={TYPE_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Movimientos · últimos 30 días" subtitle="Volumen diario consolidado">
          {dashboardQuery.isLoading ? (
            <Skeleton height={220} />
          ) : movementsByDayData.length === 0 ? (
            <EmptyState title="Sin actividad" description="Aún no hay movimientos para graficar." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={movementsByDayData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="movGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fill="url(#movGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Alertas por severidad" subtitle="Distribución activa">
          {dashboardQuery.isLoading ? (
            <Skeleton height={220} />
          ) : alertsBySeverityData.length === 0 ? (
            <EmptyState title="Sin alertas" description="No hay alertas activas." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={alertsBySeverityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {alertsBySeverityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      <section className="card">
        <header className="card__header card__header--tight">
          <h2>Inventarios</h2>
          <div className="filter-bar filter-bar--inline">
            <Search size={14} aria-hidden />
            <input
              type="search"
              placeholder="Buscar por tienda, ciudad o ID…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              aria-label="Buscar inventario"
            />
          </div>
        </header>

        {dashboardQuery.isLoading ? (
          <SkeletonRows count={5} />
        ) : !dashboard?.inventories.length ? (
          <EmptyState
            title="Aún no hay inventarios"
            description="El sistema está cargando datos iniciales. Refresca en unos segundos."
          />
        ) : filteredInventories.length === 0 ? (
          <EmptyState title="Sin coincidencias" description="Prueba con otro término." />
        ) : (
          <>
            <table className="table table--compact table--clickable">
              <caption className="visually-hidden">Inventarios activos</caption>
              <thead>
                <tr>
                  <th scope="col">Tienda</th>
                  <th scope="col">Productos</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Movs</th>
                  <th scope="col">Alertas</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((inv) => {
                  const store = storeName.get(inv.storeId);
                  return (
                    <tr key={inv.inventoryId} onClick={() => activate(inv)}>
                      <td>
                        <div className="row-title">
                          <MapPin size={14} aria-hidden /> {store?.name ?? inv.storeId}
                        </div>
                        <small>{store?.city ?? '—'}</small>
                      </td>
                      <td><strong>{inv.productCount}</strong></td>
                      <td><strong>{inv.stockTotal.toLocaleString()}</strong></td>
                      <td>{inv.movementCount}</td>
                      <td>
                        {inv.criticalAlerts > 0 ? (
                          <StatusBadge tone="danger">
                            {inv.alertCount} ({inv.criticalAlerts} crit)
                          </StatusBadge>
                        ) : inv.alertCount > 0 ? (
                          <StatusBadge tone="warn">{inv.alertCount}</StatusBadge>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge tone={inv.estadoInventario === 'optimized' ? 'default' : 'warn'}>
                          {inv.estadoInventario}
                        </StatusBadge>
                      </td>
                      <td>
                        <small>{new Date(inv.fechaUltimaActualizacion).toLocaleString()}</small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={filteredInventories.length}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <SystemStatus />

      <div className="dashboard-split">
        <section className="card">
          <header className="card__header card__header--tight">
            <h2>Movimientos recientes</h2>
            <small>{dashboard?.recentMovements.length ?? 0} eventos · todos los inventarios</small>
          </header>
          {dashboardQuery.isLoading ? (
            <SkeletonRows count={3} />
          ) : !dashboard?.recentMovements.length ? (
            <EmptyState title="Sin movimientos" description="Aparecerán aquí cuando registres entradas, salidas o ajustes." />
          ) : (
            <ul className="activity-list">
              {dashboard.recentMovements.slice(0, 10).map((m) => {
                const isOut = m.tipoMovimiento === 'salida';
                const Icon = isOut ? TrendingDown : TrendingUp;
                return (
                  <li key={m.movementId} className="activity-list__item">
                    <span
                      className={`activity-list__icon activity-list__icon--${isOut ? 'down' : 'up'}`}
                      aria-hidden
                    >
                      <Icon size={14} />
                    </span>
                    <div className="activity-list__copy">
                      <span className="activity-list__line">
                        <strong>{m.tipoMovimiento}</strong>
                        <span className="activity-list__sep">·</span>
                        <span>{m.cantidad} u</span>
                        <span className="activity-list__sep">·</span>
                        <code>{m.productId}</code>
                      </span>
                      <small>
                        {storeName.get(m.storeId)?.name ?? m.storeId}
                        <span className="activity-list__sep">·</span>
                        {new Date(m.fechaMovimiento).toLocaleString()}
                      </small>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="card__header card__header--tight">
            <h2>Alertas activas</h2>
            <small>{dashboard?.topAlerts.length ?? 0} totales · más críticas primero</small>
          </header>
          {dashboardQuery.isLoading ? (
            <SkeletonRows count={3} />
          ) : !dashboard?.topAlerts.length ? (
            <EmptyState title="Todo en orden" description="No hay alertas activas." />
          ) : (
            <ul className="activity-list">
              {dashboard.topAlerts.slice(0, 10).map((a) => (
                <li key={a.alertId} className="activity-list__item">
                  <span
                    className={`activity-list__icon activity-list__icon--${a.severidad}`}
                    aria-hidden
                  >
                    <AlertTriangle size={14} />
                  </span>
                  <div className="activity-list__copy">
                    <span className="activity-list__line">
                      <strong>{a.tipo}</strong>
                      <StatusBadge
                        tone={
                          a.severidad === 'critical'
                            ? 'danger'
                            : a.severidad === 'warning'
                              ? 'warn'
                              : 'default'
                        }
                      >
                        {a.severidad}
                      </StatusBadge>
                    </span>
                    <small>
                      {storeName.get(a.storeId)?.name ?? a.storeId}
                      <span className="activity-list__sep">·</span>
                      {a.mensaje}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number | undefined;
  loading?: boolean;
  tone?: 'default' | 'ok' | 'warn' | 'danger';
  extra?: string;
}

function KpiCard({ label, value, loading, tone = 'default', extra }: KpiCardProps) {
  return (
    <div className={`kpi-card kpi-card--${tone}`}>
      <span className="kpi-card__label">{label}</span>
      <strong className="kpi-card__value">
        {loading ? <Skeleton variant="text" width={40} /> : (value ?? 0).toLocaleString()}
      </strong>
      {extra ? <small className="kpi-card__extra">{extra}</small> : null}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="card chart-card">
      <header className="card__header card__header--tight">
        <h2>{title}</h2>
        {subtitle ? <small>{subtitle}</small> : null}
      </header>
      <div className="chart-card__body">{children}</div>
    </div>
  );
}
