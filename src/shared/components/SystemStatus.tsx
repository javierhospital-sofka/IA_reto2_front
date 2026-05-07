/**
 * Panel de estado del sistema.
 *
 * Muestra cada servicio del stack con su URL y un health badge en vivo.
 * Útil para que el operador (y la demo) sepan a qué está conectado todo.
 */

import { useEffect, useState, type JSX } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { coreApiUrl, inventoryApiUrl } from '../api/config';

type HealthState = 'unknown' | 'ok' | 'down';

interface ServiceCheck {
  label: string;
  url: string;
  /** URL pública para que el usuario haga click. Si difiere del health endpoint. */
  publicUrl?: string;
  state: HealthState;
  description: string;
}

const initialServices: ServiceCheck[] = [
  {
    label: 'Inventory service',
    url: `${inventoryApiUrl}/health`,
    publicUrl: inventoryApiUrl,
    state: 'unknown',
    description: 'API principal · 9 endpoints /v1/inventories/*'
  },
  {
    label: 'Core retail service',
    url: `${coreApiUrl}/health`,
    publicUrl: coreApiUrl,
    state: 'unknown',
    description: 'Catálogo · auth · /v1/products /v1/stores /v1/auth/login'
  }
];

const dataServices: Array<Omit<ServiceCheck, 'state' | 'url'> & { url: string }> = [
  {
    label: 'Postgres',
    url: 'postgres://postgres:postgres@localhost:5432/retail_local',
    description: 'Base de datos transaccional · accesible desde el host'
  },
  {
    label: 'Adminer',
    url: 'http://localhost:8080',
    publicUrl: 'http://localhost:8080',
    description: 'UI ligera para inspeccionar la BD · server: postgres · user/pass: postgres'
  },
  {
    label: 'Frontend',
    url: window.location.origin,
    publicUrl: window.location.origin,
    description: 'SPA React · estás aquí'
  }
];

async function checkHealth(url: string, signal: AbortSignal): Promise<HealthState> {
  try {
    const res = await fetch(url, { signal });
    return res.ok ? 'ok' : 'down';
  } catch {
    return 'down';
  }
}

export function SystemStatus(): JSX.Element {
  const [services, setServices] = useState<ServiceCheck[]>(initialServices);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 3000);
    try {
      const checks = await Promise.all(
        initialServices.map(async (svc) => ({
          ...svc,
          state: await checkHealth(svc.url, ctrl.signal)
        }))
      );
      setServices(checks);
    } finally {
      clearTimeout(timeoutId);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 15_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="card system-status">
      <header className="card__header card__header--tight">
        <h2>Estado del sistema</h2>
        <button
          type="button"
          className="button button--ghost button--sm"
          onClick={() => void refresh()}
          disabled={refreshing}
          aria-label="Refrescar estado"
        >
          <RefreshCw size={12} className={refreshing ? 'spin' : ''} aria-hidden /> Refrescar
        </button>
      </header>

      <ul className="status-grid">
        {services.map((svc) => (
          <li key={svc.label} className={`status-row status-row--${svc.state}`}>
            <span className={`status-dot status-dot--${svc.state}`} aria-hidden />
            <div className="status-row__copy">
              <strong>{svc.label}</strong>
              <small>{svc.description}</small>
              <a href={svc.publicUrl ?? svc.url} target="_blank" rel="noopener noreferrer">
                <code>{svc.publicUrl ?? svc.url}</code> <ExternalLink size={11} aria-hidden />
              </a>
            </div>
            <span className="status-label">{labelFor(svc.state)}</span>
          </li>
        ))}
        {dataServices.map((svc) => (
          <li key={svc.label} className="status-row status-row--data">
            <span className="status-dot status-dot--data" aria-hidden />
            <div className="status-row__copy">
              <strong>{svc.label}</strong>
              <small>{svc.description}</small>
              {svc.publicUrl ? (
                <a href={svc.publicUrl} target="_blank" rel="noopener noreferrer">
                  <code>{svc.url}</code> <ExternalLink size={11} aria-hidden />
                </a>
              ) : (
                <code>{svc.url}</code>
              )}
            </div>
            <span className="status-label">disponible</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function labelFor(state: HealthState): string {
  switch (state) {
    case 'ok':
      return 'healthy';
    case 'down':
      return 'down';
    default:
      return 'verificando…';
  }
}
