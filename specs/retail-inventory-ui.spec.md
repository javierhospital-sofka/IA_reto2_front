# ASSD Spec (Frontend slice): Retail Inventory UI

> Spec global de referencia: [`../../.github/specs/retail-inventory.spec.md`](../../.github/specs/retail-inventory.spec.md)

## Contexto

Slice frontend del agregado `RetailInventoryAggregate`: 6 rutas operativas, formularios validados con RHF + Zod, charts con recharts, tablas con paginación + búsqueda, toasts a11y, edición inline, modal PATCH para movimientos.

## Alcance

Incluye:
- 6 rutas: `/login`, `/inventario`, `/inventories/:id/products`, `/inventories/:id/movements`, `/inventories/:id/optimization`, `/inventories/:id/alerts`.
- Formularios para crear inventario, registrar/editar productos, registrar/editar movimientos, ejecutar optimización.
- Dashboard agregado con totales + charts (movements-by-type donut, alerts-by-severity donut, movements-by-day area, stock-by-category bar, top inventories bar).
- Sistema de toasts (`aria-live`), `ConfirmDialog` con focus trap, `EmptyState`, `Skeleton` loaders.
- Paginación + búsqueda en tablas grandes.
- Traducción de errores HTTP via `getApiErrorMessage`.

No incluye:
- I18n (locale fijo español del brief).
- Marketing copy ni dashboards decorativos.
- Páginas administrativas extra (roles, settings).

## Reglas (vista frontend)

1. **Cero `window.alert/confirm`** — usar `Toast` y `ConfirmDialog`.
2. **Cero errores HTTP crudos** — pasar por `getApiErrorMessage(error)`.
3. **Validación Zod en todo formulario** (`useForm({ resolver: zodResolver })`).
4. **Versionado optimista**: enviar `expectedVersion` desde el cache TanStack Query; en 409 mostrar toast "Conflicto de versión" + acción "Recargar".
5. **A11y mínimo**: `aria-label`, `aria-live`, `aria-invalid`, `<label htmlFor>`, `<th scope="col">`.
6. **Charts con recharts**, no SVG manual.
7. **Skeleton + EmptyState + Toast** en cada vista que lista o muta datos.

## Componentes clave

| Componente | Responsabilidad |
|---|---|
| `<PrivateRoute />` | Guard de autenticación |
| `Toast` + `ToastProvider` | Feedback con `aria-live` y auto-dismiss |
| `ConfirmDialog` | Confirmación con focus trap + restore |
| `Pagination` | Tablas grandes (>10 filas) |
| `SedePickerDialog` | Selección global de tienda activa |
| `getApiErrorMessage(error)` | Traducción 400/401/404/409/500 |

## Criterios de aceptación (frontend slice)

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| RI-1-FE | Sin sede activa | usuario abre `/inventario` | Render de `SedePickerDialog` o estado vacío con CTA |
| RI-2-FE | Sede seleccionada | usuario crea inventario nuevo | POST `/v1/inventories` + toast éxito + redirect a productos |
| RI-3-FE | Producto sin `stockInicial` | submit form de producto | Toast "registro creado (incompleto)" sin bloquear |
| RI-4-FE | API responde 409 | render de toast | Mensaje "Conflicto de versión" + acción "Recargar" |
| RI-5-FE | Tabla con > 10 movimientos | render | `Pagination` aparece y funciona |
| RI-6-FE | Submit form con campos inválidos | validación RHF + Zod | Mensaje inline accesible (`aria-invalid` + texto) |
| RI-7-FE | Sin token (logout) | navegación a ruta privada | Redirect a `/login` |
| RI-8-FE | Token presente | `/inventario` | Carga dashboard con charts (≥ 4 cards) |
| RI-9-FE | API down | cualquier vista | Toast con mensaje legible (no "Error: 500" crudo) |
| RI-10-FE | Click "Ejecutar optimización" | POST `/optimize` | Toast éxito + recarga snapshots + sugerencias visibles |

## Trazabilidad (frontend)

| Criterio | Implementación | Test |
|---|---|---|
| RI-1-FE, RI-2-FE | `InventoryHomePage`, `SedePickerDialog` | smoke `routes.smoke.test.tsx` |
| RI-3-FE | `InventoryProductsPage` form + toast | manual acceptance |
| RI-4-FE | `getApiErrorMessage` + `Toast` | `getApiErrorMessage.test.ts` |
| RI-5-FE | `Pagination` | `Pagination.test.tsx` |
| RI-6-FE | RHF + Zod resolvers en cada form | `InventoryMovementsPage.test.tsx` |
| RI-7-FE | `<PrivateRoute />` redirect | `PrivateRoute.test.tsx` |
| RI-8-FE | `InventoryHomePage` charts | E2E Playwright dashboard |
| RI-9-FE | `getApiErrorMessage` global | `getApiErrorMessage.test.ts` |
| RI-10-FE | `InventoryOptimizationPage` mutation | E2E Playwright optimization |

## Pruebas

- **Unit + integration** (`src/**/*.test.{ts,tsx}`): 32 specs (LoginPage, InventoryMovementsPage, Toast, ConfirmDialog, Pagination, getApiErrorMessage, smoke routes).
- **E2E Playwright**: 3 flujos críticos (dashboard, productos, movimientos).
- **Coverage**: thresholds configurados en `vite.config.ts` (lines 80% / branches 70%).

## Riesgos y supuestos

- Sin SSR — Vite SPA puro. SEO no aplica al ser herramienta interna.
- Browser support: últimas 2 versiones de Chrome/Firefox/Safari.
- Estado global mínimo: TanStack Query cache + sede activa + auth context. Sin Redux.
- Stepper visual no bloquea navegación (validación final en backend).
