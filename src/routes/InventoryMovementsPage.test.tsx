/**
 * Feature integration test for the movements workflow.
 *
 * Mocks the inventory API at the module boundary so the test focuses on:
 *   - the page renders with the expected accessible structure
 *   - the create form validates with Zod (cantidad must be positive)
 *   - successful submission produces a toast
 *   - the edit modal opens with proper a11y (dialog role + aria-modal)
 *
 * Network is mocked via vi.mock — no fetch happens.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Movement, MovementType } from '../shared/api/contracts';
import { ToastProvider } from '../shared/components/ui/Toast';

const sampleProducts = [
  {
    productId: 'p1',
    nombre: 'Café Arábica',
    categoria: 'bebidas',
    providerId: null,
    stockInicial: 50,
    stockDisponible: 50,
    stockReservado: 0,
    stockProyectado: 41,
    stockMinimo: 10,
    stockMaximo: 60,
    leadTimeReposicion: 3,
    estadoValidacion: 'complete' as const,
    alertas: []
  }
];

const initialMovement: Movement = {
  movementId: 'm-existing',
  productId: 'p1',
  tipoMovimiento: 'entrada' as MovementType,
  fechaMovimiento: '2026-05-06T11:00:00.000Z',
  cantidad: 5,
  estado: 'registrado',
  version: 1,
  origen: 'web',
  destino: 'store'
};

const movementsList: Movement[] = [initialMovement];

vi.mock('../shared/api/inventoryApi', () => ({
  getInventoryProducts: vi.fn(async () => ({ data: sampleProducts })),
  getMovements: vi.fn(async () => ({ data: movementsList })),
  getState: vi.fn(async () => ({
    data: {
      inventory: {
        inventoryId: 'inv-1',
        storeId: 's-1',
        estadoInventario: 'active',
        version: 3,
        fechaUltimaActualizacion: '2026-05-06T12:00:00.000Z'
      },
      products: sampleProducts,
      movements: movementsList,
      alerts: [],
      suggestions: [],
      summary: { inventoryId: 'inv-1', stockTotal: 50, totalProductos: 1, totalAlertas: 0, totalSugerencias: 0 }
    }
  })),
  createMovement: vi.fn(async (_invId: string, payload: { cantidad: number; productId: string }) => ({
    data: {
      movement: {
        movementId: 'm-new',
        productId: payload.productId,
        tipoMovimiento: 'entrada',
        fechaMovimiento: '2026-05-06T13:00:00.000Z',
        cantidad: payload.cantidad,
        estado: 'registrado',
        version: 1
      },
      inventoryVersion: 4
    }
  })),
  patchMovement: vi.fn(async () => ({
    data: {
      movement: { ...initialMovement, cantidad: 99, estado: 'editado', version: 2 },
      inventoryVersion: 4
    }
  }))
}));

import { InventoryMovementsPage } from './InventoryMovementsPage';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/inventories/inv-1/movements']}>
          <Routes>
            <Route
              path="/inventories/:inventoryId/movements"
              element={<InventoryMovementsPage />}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('InventoryMovementsPage', () => {
  it('renders the create form with proper accessibility hooks', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 2, name: /registrar movimiento/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^producto$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^cantidad$/i)).toBeInTheDocument();
  });

  it('shows a Zod error when cantidad < 1', async () => {
    const user = userEvent.setup();
    renderPage();

    // Wait for products to load and fill the select dropdown
    await screen.findByRole('option', { name: /café arábica/i });
    const productSelect = screen.getByLabelText(/^producto$/i);
    await user.selectOptions(productSelect, 'p1');

    const cantidad = screen.getByLabelText(/^cantidad$/i);
    await user.clear(cantidad);
    await user.type(cantidad, '0');

    await user.click(screen.getByRole('button', { name: /^registrar$/i }));

    expect(await screen.findByText(/mayor a cero/i)).toBeInTheDocument();
  });

  it('opens an accessible edit dialog when the edit button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    const editButton = await screen.findByRole('button', {
      name: /editar movimiento m-existing/i
    });
    await user.click(editButton);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByLabelText(/nueva cantidad/i)).toBeInTheDocument();
  });

  it('shows a success toast after a movement is registered', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('option', { name: /café arábica/i });
    const productSelect = screen.getByLabelText(/^producto$/i);
    await user.selectOptions(productSelect, 'p1');

    const cantidad = screen.getByLabelText(/^cantidad$/i);
    await user.clear(cantidad);
    await user.type(cantidad, '3');

    await user.click(screen.getByRole('button', { name: /^registrar$/i }));

    await waitFor(() =>
      expect(screen.getByText(/movimiento registrado/i)).toBeInTheDocument()
    );
  });
});
