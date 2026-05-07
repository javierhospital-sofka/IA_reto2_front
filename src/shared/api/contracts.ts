export type AuthUser = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
};

export type Store = {
  storeId: string;
  name: string;
  city: string;
};

export type CatalogProduct = {
  productId: string;
  name: string;
  category: string;
  providerId: string | null;
  stockInicial?: number | null;
};

export type Inventory = {
  inventoryId: string;
  storeId: string;
  estadoInventario: string;
  version: number;
  fechaUltimaActualizacion: string;
};

export type InventoryProduct = {
  productId: string;
  nombre: string;
  categoria: string;
  providerId: string | null;
  stockInicial: number | null;
  stockDisponible: number | null;
  stockReservado: number | null;
  stockProyectado: number | null;
  stockMinimo: number | null;
  stockMaximo: number | null;
  leadTimeReposicion: number | null;
  estadoValidacion: 'complete' | 'incomplete' | 'invalid';
  alertas: string[];
};

/** Shape sent to PUT /v1/inventories/:id/products. Computed fields are
 * derived server-side and must not be sent. */
export type InventoryProductInput = {
  productId: string;
  nombre: string;
  categoria: string;
  providerId: string | null;
  stockInicial: number | null;
  stockMinimo: number | null;
  stockMaximo: number | null;
  leadTimeReposicion: number | null;
};

export type MovementType = 'entrada' | 'salida' | 'ajuste' | 'reserva' | 'liberacion';

export type Movement = {
  movementId: string;
  productId: string;
  tipoMovimiento: MovementType;
  fechaMovimiento: string;
  cantidad: number;
  origen?: string;
  destino?: string;
  estado: 'registrado' | 'editado' | 'anulado';
  version: number;
};

export type InventorySummary = {
  inventoryId: string;
  stockTotal: number;
  totalProductos: number;
  totalAlertas: number;
  totalSugerencias: number;
};

export type InventoryState = {
  inventory: Inventory;
  products: InventoryProduct[];
  movements: Movement[];
  alerts: InventoryAlert[];
  suggestions: ReplenishmentSuggestion[];
  summary: InventorySummary;
};

export type InventoryAlert = {
  alertId: string;
  productId?: string;
  tipo: string;
  severidad: 'critical' | 'warning' | 'info';
  mensaje: string;
};

export type ReplenishmentSuggestion = {
  suggestionId: string;
  productId: string;
  cantidadSugerida: number;
  puntoReorden: number;
  loteEconomico: number;
  razon: string;
};
