/**
 * Application shell.
 *
 * El sidebar concentra el contexto operativo:
 *  - Sede activa (tienda + inventario + versión)
 *  - Botón "Cambiar sede" → SedePickerDialog
 *  - User chip compacto al pie con logout
 *
 * Las páginas son operativas (forms, tablas), sin wizard duplicado.
 */

import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PackageSearch,
  Repeat,
  Repeat2,
  MapPin
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../features/auth/AuthProvider';
import { getStores } from '../api/catalogApi';
import { getState } from '../api/inventoryApi';
import { SedePickerDialog } from './ui/SedePickerDialog';

export function AppShell({ children }: PropsWithChildren) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem('retail-shell-collapsed') === 'true'
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const inventoryIdFromRoute = params.inventoryId ?? null;
  const inventoryIdFromSession =
    typeof window !== 'undefined' ? sessionStorage.getItem('activeInventoryId') : null;
  const activeInventoryId = inventoryIdFromRoute ?? inventoryIdFromSession ?? null;
  const inventoryBase = activeInventoryId ? `/inventories/${activeInventoryId}` : '/inventario';

  const stateQuery = useQuery({
    queryKey: ['inventory-state', activeInventoryId],
    queryFn: () => getState(activeInventoryId as string),
    enabled: Boolean(activeInventoryId),
    staleTime: 15_000
  });
  const storesQuery = useQuery({
    queryKey: ['stores'],
    queryFn: getStores,
    staleTime: 60_000
  });

  const inv = stateQuery.data?.data.inventory;
  const activeStoreId =
    inv?.storeId ?? (typeof window !== 'undefined' ? sessionStorage.getItem('activeStoreId') : null);

  const storeName = useMemo(() => {
    if (!activeStoreId) return null;
    return storesQuery.data?.data.find((s) => s.storeId === activeStoreId);
  }, [storesQuery.data, activeStoreId]);

  function toggleSidebar() {
    setIsCollapsed((current) => {
      const next = !current;
      localStorage.setItem('retail-shell-collapsed', String(next));
      return next;
    });
  }

  useEffect(() => {
    if (inventoryIdFromRoute) {
      sessionStorage.setItem('activeInventoryId', inventoryIdFromRoute);
    }
  }, [inventoryIdFromRoute]);

  useEffect(() => {
    if (inv?.storeId) sessionStorage.setItem('activeStoreId', inv.storeId);
  }, [inv?.storeId]);

  return (
    <div className={`app-shell ${isCollapsed ? 'shell-collapsed' : ''}`}>
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>
      <aside className="sidebar" aria-label="Barra lateral">
        <div className="sidebar-top">
          <div className="brand">
            <span className="brand-mark">RIA</span>
            <span className="brand-copy">
              Retail IA
              <small>Inventory Center</small>
            </span>
          </div>
          <button
            aria-label={isCollapsed ? 'Expandir navegación' : 'Minimizar navegación'}
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expandir navegación' : 'Minimizar navegación'}
            type="button"
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Sede activa: contexto global */}
        <div className="sede-panel" aria-live="polite">
          <span className="eyebrow">Sede activa</span>
          {activeStoreId ? (
            <>
              <strong className="sede-panel__name">
                <MapPin size={14} aria-hidden /> {storeName?.name ?? activeStoreId}
              </strong>
              <small className="sede-panel__city">{storeName?.city ?? '—'}</small>
              <div className="sede-panel__meta">
                {inv ? (
                  <>
                    <span title="Inventario">{inv.inventoryId.slice(0, 12)}…</span>
                    <span className={`sede-panel__pill sede-panel__pill--${inv.estadoInventario}`}>
                      {inv.estadoInventario}
                    </span>
                    <span title="Versión">v{inv.version}</span>
                  </>
                ) : (
                  <span className="sede-panel__loading">Cargando…</span>
                )}
              </div>
            </>
          ) : (
            <span className="sede-panel__empty">Sin sede seleccionada</span>
          )}
          <button
            type="button"
            className="button button--ghost button--sm sede-panel__action"
            onClick={() => setPickerOpen(true)}
          >
            <Repeat2 size={14} aria-hidden /> Cambiar sede
          </button>
        </div>

        <div className="nav-section">Operación</div>
        <nav className="nav" aria-label="Principal">
          <NavLink title="Resumen / sedes" to="/inventario" end>
            <BarChart3 size={18} aria-hidden /> <span>Resumen</span>
          </NavLink>
          <SedeAwareLink
            to={`${inventoryBase}/products`}
            disabled={!activeInventoryId}
            onDisabledClick={() => setPickerOpen(true)}
            label="Productos"
            icon={<Boxes size={18} aria-hidden />}
          />
          <SedeAwareLink
            to={`${inventoryBase}/movements`}
            disabled={!activeInventoryId}
            onDisabledClick={() => setPickerOpen(true)}
            label="Movimientos"
            icon={<Repeat size={18} aria-hidden />}
          />
          <SedeAwareLink
            to={`${inventoryBase}/optimization`}
            disabled={!activeInventoryId}
            onDisabledClick={() => setPickerOpen(true)}
            label="Optimización"
            icon={<PackageSearch size={18} aria-hidden />}
          />
          <SedeAwareLink
            to={`${inventoryBase}/alerts`}
            disabled={!activeInventoryId}
            onDisabledClick={() => setPickerOpen(true)}
            label="Alertas"
            icon={<AlertTriangle size={18} aria-hidden />}
          />
        </nav>

        <div className="user-chip">
          <div>
            <strong>{user?.displayName}</strong>
            <small>{user?.role}</small>
          </div>
          <button
            type="button"
            aria-label="Salir"
            title="Cerrar sesión"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={16} aria-hidden />
          </button>
        </div>
      </aside>

      <main className="main" id="main-content">
        <div className="main-inner">{children}</div>
      </main>

      <SedePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentStoreId={activeStoreId}
      />
    </div>
  );
}

interface SedeAwareLinkProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  onDisabledClick: () => void;
}

/**
 * Item de navegación que requiere una sede activa. Si está deshabilitado:
 *  - Se muestra atenuado y con tooltip explicativo.
 *  - Al hacer click, en lugar de navegar a `/inventario` silenciosamente,
 *    abre el SedePickerDialog para que el usuario active una sede primero.
 */
function SedeAwareLink({ to, label, icon, disabled, onDisabledClick }: SedeAwareLinkProps) {
  if (disabled) {
    return (
      <button
        type="button"
        className="nav-link nav-link--disabled"
        onClick={onDisabledClick}
        aria-disabled="true"
        title="Selecciona una sede para continuar"
      >
        {icon} <span>{label}</span>
      </button>
    );
  }
  return (
    <NavLink title={label} to={to}>
      {icon} <span>{label}</span>
    </NavLink>
  );
}
