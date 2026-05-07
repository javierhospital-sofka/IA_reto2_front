/**
 * Smoke tests para las páginas restantes (Home, Products, Optimization, Alerts).
 *
 * No buscan profundidad — verifican que cada ruta renderiza sin crash con
 * la API mockeada y muestran su heading. La cobertura profunda de la lógica
 * vive en pruebas E2E (Playwright).
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../shared/components/ui/Toast';

const baseDashboardPayload = {
  data: {
    totals: {
      inventoryCount: 0,
      productCount: 0,
      stockTotal: 0,
      alertCount: 0,
      criticalAlerts: 0,
      suggestionCount: 0,
      movementCount: 0
    },
    inventories: [],
    recentMovements: [],
    topAlerts: [],
    charts: {
      movementsByType: {},
      alertsBySeverity: {},
      movementsByDay: [],
      stockByCategory: [],
      topInventoriesByStock: []
    }
  }
};

const baseStatePayload = {
  data: {
    inventory: {
      inventoryId: 'inv-1',
      storeId: 'store-1',
      estadoInventario: 'active',
      version: 1,
      fechaUltimaActualizacion: '2026-05-07T10:00:00.000Z'
    },
    products: [],
    movements: [],
    alerts: [],
    suggestions: [],
    summary: { inventoryId: 'inv-1', stockTotal: 0, totalProductos: 0, totalAlertas: 0, totalSugerencias: 0 }
  }
};

vi.mock('../shared/api/inventoryApi', () => ({
  getDashboard: vi.fn(async () => baseDashboardPayload),
  getInventoryProducts: vi.fn(async () => ({ data: [] })),
  getMovements: vi.fn(async () => ({ data: [] })),
  getState: vi.fn(async () => baseStatePayload),
  getSummary: vi.fn(async () => ({
    data: { inventoryId: 'inv-1', stockTotal: 0, totalProductos: 0, totalAlertas: 0, totalSugerencias: 0 }
  })),
  optimizeInventory: vi.fn(async () => baseStatePayload),
  putInventoryProducts: vi.fn(),
  createMovement: vi.fn(),
  patchMovement: vi.fn(),
  createInventory: vi.fn()
}));

vi.mock('../shared/api/catalogApi', () => ({
  getStores: vi.fn(async () => ({ data: [] })),
  getCatalogProducts: vi.fn(async () => ({ data: [] }))
}));

import { InventoryHomePage } from './InventoryHomePage';
import { InventoryProductsPage } from './InventoryProductsPage';
import { InventoryOptimizationPage } from './InventoryOptimizationPage';
import { InventoryAlertsPage } from './InventoryAlertsPage';

function renderRoute(initialEntry: string, element: React.ReactElement, path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path={path} element={element} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('routes smoke', () => {
  it('renders InventoryHomePage with the Resumen heading', async () => {
    renderRoute('/inventario', <InventoryHomePage />, '/inventario');
    expect(await screen.findByRole('heading', { level: 1, name: /resumen/i })).toBeInTheDocument();
  });

  it('renders InventoryProductsPage with the Productos heading', async () => {
    renderRoute(
      '/inventories/inv-1/products',
      <InventoryProductsPage />,
      '/inventories/:inventoryId/products'
    );
    expect(await screen.findByRole('heading', { level: 1, name: /productos/i })).toBeInTheDocument();
  });

  it('renders InventoryOptimizationPage with the Optimización heading', async () => {
    renderRoute(
      '/inventories/inv-1/optimization',
      <InventoryOptimizationPage />,
      '/inventories/:inventoryId/optimization'
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: /optimización/i })
    ).toBeInTheDocument();
  });

  it('renders InventoryAlertsPage with the Alertas heading', async () => {
    renderRoute(
      '/inventories/inv-1/alerts',
      <InventoryAlertsPage />,
      '/inventories/:inventoryId/alerts'
    );
    expect(await screen.findByRole('heading', { level: 1, name: /alertas/i })).toBeInTheDocument();
  });
});
