# Frontend — inventario-retail-web

SPA React 19 + Vite + TypeScript que cubre las 5 rutas operativas del brief con foco explícito en UX, validación, accesibilidad y pruebas.

## Stack

| Tecnología | Uso |
|---|---|
| React 19 + Vite 7 | UI + dev server |
| TypeScript estricto | Tipado |
| React Router 7 | Navegación + PrivateRoute |
| TanStack Query 5 | Estado servidor (cache + invalidación) |
| React Hook Form + Zod | Formularios validados |
| lucide-react | Iconografía |
| Vitest + Testing Library + jsdom | Pruebas unitarias + integración |

## Cómo correr

```bash
npm install
npm run dev          # Vite en :5173
npm test             # 25 specs
npm run typecheck    # tsc --noEmit
npm run build        # tsc + vite build
npm run coverage     # con thresholds 80/70
```

## Rutas

| Path | Página | Función |
|---|---|---|
| `/login` | LoginPage | Login con RHF+Zod (errores en `aria-live`) |
| `/inventario` | InventoryHomePage | Crear/abrir inventario por tienda (paso 1) |
| `/inventories/:id/products` | InventoryProductsPage | Gestión de productos + paginación + búsqueda |
| `/inventories/:id/movements` | InventoryMovementsPage | Bitácora cronológica + edición + anulación |
| `/inventories/:id/optimization` | InventoryOptimizationPage | Ejecutar optimización + sugerencias |
| `/inventories/:id/alerts` | InventoryAlertsPage | Bandeja filtrable por severidad |

## Arquitectura

```
src/
├── app/
│   ├── providers.tsx        # QueryClient + AuthProvider + ToastProvider
│   ├── router.tsx           # BrowserRouter + PrivateRoute
│   └── styles.css           # Design tokens + primitives CSS
├── routes/                  # Páginas (1 por ruta)
│   ├── InventoryHomePage.tsx
│   ├── InventoryProductsPage.tsx
│   ├── InventoryMovementsPage.tsx
│   ├── InventoryOptimizationPage.tsx
│   ├── InventoryAlertsPage.tsx
│   └── LoginPage.tsx
├── features/
│   └── auth/
│       ├── AuthProvider.tsx
│       ├── PrivateRoute.tsx
│       └── authStorage.ts
└── shared/
    ├── components/
    │   ├── AppShell.tsx     # Sidebar + topbar + Stepper
    │   ├── PageHeader.tsx
    │   ├── StatusBadge.tsx
    │   └── ui/              ★ Primitivos compartidos
    │       ├── Toast.tsx           # ToastProvider + useToast
    │       ├── ConfirmDialog.tsx   # Modal a11y con focus restore
    │       ├── Stepper.tsx         # Stepper visual del flujo
    │       ├── Skeleton.tsx        # Loading skeletons
    │       ├── Pagination.tsx      # + helper paginate()
    │       └── EmptyState.tsx
    ├── lib/
    │   ├── getApiErrorMessage.ts  # ApiError → mensaje legible
    │   └── inventorySchemas.ts    # Zod (espejo del backend)
    └── api/
        ├── httpClient.ts          # fetch + ApiError
        ├── inventoryApi.ts
        ├── catalogApi.ts
        ├── authApi.ts
        ├── contracts.ts
        └── config.ts
```

## Decisiones técnicas

### Validación con RHF + Zod
Schemas en `shared/lib/inventorySchemas.ts` (espejo del backend `retailContracts.ts`). Cada formulario usa `useForm({ resolver: zodResolver(schema) })`. Los errores se publican con `role="alert"` y el input recibe `aria-invalid` + `aria-describedby`.

### Sistema de toasts
`ToastProvider` mantiene un `aria-live="polite"` region con auto-dismiss. Reemplaza:
- Silencios después de mutaciones exitosas (causa de UX confusa).
- `window.alert/confirm` (no a11y, bloqueantes).
- Mensajes HTTP crudos al usuario (`"Error: 404"` → `"Recurso no encontrado: vuelve a abrir la tienda"`).

API: `toast.success(title, desc)` / `error` / `warning` / `info`.

### Modal a11y
`ConfirmDialog`:
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + `aria-describedby`
- Cierra con `Escape` (a menos que `isPending`)
- Restaura el foco al cerrar
- Auto-foca el botón de confirmar al abrir
- Tono `danger` para acciones destructivas

### Stepper del flujo
Indicador visual de los 5 pasos del brief. Marca `done` automáticamente cuando hay datos en el aggregate. **No bloquea** la navegación (criterio de evaluación: claridad sin frustrar).

### Helper de errores
`getApiErrorMessage(error)` traduce `ApiError` (con código semántico del backend) en `{title, description}` accionable en español. Mapea explícitamente `BAD_REQUEST | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | UPSTREAM_UNAVAILABLE`.

### Versionado optimista en mutaciones
Las mutaciones envían `expectedVersion` derivado del `state` cacheado por TanStack Query. Si el backend responde `409`, el toast informa "Conflicto de versión" y sugiere recargar.

### Edición de movimientos (gap del brief cerrado)
La página de movimientos abre un `ConfirmDialog` con un input para editar la cantidad (PATCH al backend). También expone "Anular" que envía `estado: 'anulado'`.

## Pruebas

| Archivo | Cobertura |
|---|---|
| `routes/LoginPage.test.tsx` | Render + Zod validation |
| `routes/InventoryMovementsPage.test.tsx` | Render + Zod + dialog + toast (mock API) |
| `shared/components/ui/Toast.test.tsx` | Provider + auto-dismiss + close button + aria-live |
| `shared/components/ui/ConfirmDialog.test.tsx` | Focus + Escape + tones + isPending |
| `shared/components/ui/Pagination.test.tsx` | Helper + buttons + disabled state |
| `shared/lib/getApiErrorMessage.test.ts` | Mapeo de cada AppErrorCode |

```bash
npm test               # 25/25 passing
npm run coverage       # opcional, thresholds 80/70 en vite.config.ts
```

## Variables de entorno

`Front-end/.env.example`:

```env
VITE_INVENTORY_API_URL=http://localhost:3001
VITE_CORE_API_URL=http://localhost:3002
```

## Usuario demo

```text
admin.retail@sofka.local
RetailDemo2026!
```

## Accesibilidad

- `skip-link` al `<main>`
- `aria-label` en sidebar y todas las regiones de navegación
- Tablas con `<caption>` (visualmente oculto) y `<th scope="col">`
- Inputs con `<label htmlFor>` correspondiente
- Toasts en `aria-live="polite"`
- Modales con focus trap + retorno de foco
- `aria-current="step"` en stepper

## Supuestos

- El frontend espeja schemas Zod del backend en lugar de importarlos como paquete (mantiene independencia de versiones).
- La navegación entre pasos del stepper no se bloquea (criterio de UX), pero el backend bloquea operaciones inválidas vía `expectedVersion` y validación.
- La paginación es client-side: las listas son por inventario y caben en memoria (≤ 10k items). Para escalas mayores, los endpoints aceptan `?page=&pageSize=` (no usado aquí).
