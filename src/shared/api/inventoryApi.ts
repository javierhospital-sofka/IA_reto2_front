/**
 * Inventory service HTTP client.
 *
 * Mirrors the new backend response shapes that include `version` after every
 * mutation, enabling the UI to send `expectedVersion` on subsequent writes
 * (optimistic locking).
 */

import type {
  Inventory,
  InventoryProduct,
  InventoryProductInput,
  InventoryState,
  InventorySummary,
  Movement,
  MovementType
} from './contracts';
import { apiRequest } from './httpClient';

interface MutationVersionResponse<T> {
  data: T & { version?: number; inventoryVersion?: number };
}

export function createInventory(payload: { storeId: string; idempotencyKey?: string }) {
  return apiRequest<{ data: Inventory }>('inventory', '/v1/inventories', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getInventoryProducts(inventoryId: string) {
  return apiRequest<{ data: InventoryProduct[] }>(
    'inventory',
    `/v1/inventories/${inventoryId}/products`
  );
}

export function putInventoryProducts(
  inventoryId: string,
  products: InventoryProductInput[],
  expectedVersion?: number
) {
  return apiRequest<MutationVersionResponse<{ products: InventoryProduct[] }>>(
    'inventory',
    `/v1/inventories/${inventoryId}/products`,
    {
      method: 'PUT',
      body: JSON.stringify({ products, expectedVersion })
    }
  );
}

export function getMovements(inventoryId: string) {
  return apiRequest<{ data: Movement[] }>('inventory', `/v1/inventories/${inventoryId}/movements`);
}

export interface CreateMovementInput {
  productId: string;
  tipoMovimiento: MovementType;
  cantidad: number;
  fechaMovimiento?: string;
  origen?: string;
  destino?: string;
  expectedVersion?: number;
}

export function createMovement(inventoryId: string, movement: CreateMovementInput) {
  return apiRequest<MutationVersionResponse<{ movement: Movement }>>(
    'inventory',
    `/v1/inventories/${inventoryId}/movements`,
    {
      method: 'POST',
      body: JSON.stringify(movement)
    }
  );
}

export interface PatchMovementInput {
  tipoMovimiento?: MovementType;
  cantidad?: number;
  fechaMovimiento?: string;
  origen?: string;
  destino?: string;
  estado?: 'editado' | 'anulado';
  expectedVersion: number;
}

export function patchMovement(
  inventoryId: string,
  movementId: string,
  patch: PatchMovementInput
) {
  return apiRequest<MutationVersionResponse<{ movement: Movement }>>(
    'inventory',
    `/v1/inventories/${inventoryId}/movements/${movementId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch)
    }
  );
}

export function getSummary(inventoryId: string) {
  return apiRequest<{ data: InventorySummary }>('inventory', `/v1/inventories/${inventoryId}/summary`);
}

export function getState(inventoryId: string) {
  return apiRequest<{ data: InventoryState }>('inventory', `/v1/inventories/${inventoryId}/state`);
}

export function optimizeInventory(inventoryId: string) {
  return apiRequest<{ data: InventoryState }>(
    'inventory',
    `/v1/inventories/${inventoryId}/optimize`,
    { method: 'POST' }
  );
}

export interface DashboardInventoryView extends Inventory {
  productCount: number;
  stockTotal: number;
  alertCount: number;
  criticalAlerts: number;
  suggestionCount: number;
  movementCount: number;
}

export interface DashboardRecentMovement {
  inventoryId: string;
  storeId: string;
  movementId: string;
  productId: string;
  tipoMovimiento: string;
  cantidad: number;
  fechaMovimiento: string;
  estado: string;
}

export interface DashboardAlert {
  alertId: string;
  productId?: string;
  tipo: string;
  severidad: 'critical' | 'warning' | 'info';
  mensaje: string;
  inventoryId: string;
  storeId: string;
}

export interface DashboardCharts {
  movementsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  movementsByDay: Array<{ date: string; count: number }>;
  stockByCategory: Array<{ category: string; stock: number }>;
  topInventoriesByStock: Array<{
    inventoryId: string;
    storeId: string;
    stockTotal: number;
    alertCount: number;
  }>;
}

export interface DashboardData {
  totals: {
    inventoryCount: number;
    productCount: number;
    stockTotal: number;
    alertCount: number;
    criticalAlerts: number;
    suggestionCount: number;
    movementCount: number;
  };
  inventories: DashboardInventoryView[];
  recentMovements: DashboardRecentMovement[];
  topAlerts: DashboardAlert[];
  charts: DashboardCharts;
}

export function getDashboard() {
  return apiRequest<{ data: DashboardData }>('inventory', '/v1/inventories');
}

export function seedDemo() {
  return apiRequest<{
    data: {
      seededInventories: number;
      reusedInventories: number;
      seededProducts: number;
      seededMovements: number;
      warning?: string;
    };
  }>('inventory', '/v1/_demo-seed', { method: 'POST', body: '{}' });
}
