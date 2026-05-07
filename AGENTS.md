# AGENTS.md — Frontend (inventario-retail-web)

Convención **Codex CLI / GitHub Copilot Agents / Cursor / Claude Code**: instrucciones para agentes que operan en este repo.

## Stack

- React 19 · Vite 7 · TypeScript estricto
- React Router 7 (BrowserRouter + PrivateRoute)
- TanStack Query 5 (cache + invalidación + `refetchInterval`)
- React Hook Form + `@hookform/resolvers/zod`
- Zod (schemas espejados desde el backend en `shared/lib/inventorySchemas.ts`)
- recharts (charts reales — bar, donut, area)
- lucide-react (iconografía)
- Vitest + Testing Library + jsdom

## Rutas

```
/login
/inventario                              ← dashboard con charts y system status
/inventories/:id/products
/inventories/:id/movements
/inventories/:id/optimization
/inventories/:id/alerts
```

## Arquitectura

```
src/
├── app/
│   ├── providers.tsx     # QueryClient + AuthProvider + ToastProvider
│   ├── router.tsx
│   └── styles.css        # design tokens + primitives
├── routes/               # 1 página por ruta
├── features/auth/
└── shared/
    ├── components/
    │   ├── AppShell.tsx
    │   ├── SystemStatus.tsx
    │   └── ui/           # Toast, ConfirmDialog, Skeleton, Pagination,
    │                     # EmptyState, SedePickerDialog, Stepper
    ├── lib/
    │   ├── getApiErrorMessage.ts
    │   └── inventorySchemas.ts
    └── api/
        ├── httpClient.ts
        ├── inventoryApi.ts
        ├── catalogApi.ts
        └── contracts.ts
```

## Reglas duras

- **Cero `window.alert/confirm`** — usar `Toast` y `ConfirmDialog`.
- **Cero errores HTTP crudos al usuario** — pasar siempre por `getApiErrorMessage(error)`.
- **Validación Zod en cada formulario** (`useForm({ resolver: zodResolver(schema) })`).
- **Versionado optimista**: las mutaciones envían `expectedVersion` desde el cache de TanStack Query; manejar 409 con toast accionable.
- **Skeleton**, no "Cargando…" plano.
- **Tablas grandes con `Pagination` + `paginate()`**.
- **A11y mínimo**: `aria-label`, `aria-live="polite"` en toasts, `role="dialog"` + `aria-modal`, `<label htmlFor>`, `<th scope="col">`, `<caption>` visualmente oculto.
- **Charts con recharts**, no SVG manual.
- **Sede activa como contexto global** en sidebar (no wizard duplicado con stepper).

## Comandos

```bash
npm install
npm run dev          # Vite (5173 dentro del container, 5174 en host)
npm test             # 32 specs
npm run typecheck
npm run build
npm run coverage     # con thresholds 80/70
```

## Variables de entorno

| Variable | Default | Uso |
|---|---|---|
| `VITE_INVENTORY_API_URL` | `http://localhost:3001` | inventory-service |
| `VITE_CORE_API_URL` | `http://localhost:3002` | core-retail-service + auth |

## Definition of Done para un slice de frontend

1. Spec ASSD asociada (`../.github/specs/<feature>.spec.md`).
2. `npm run typecheck` limpio.
3. `npm test` 100% verde.
4. A11y verificado: labels, roles, focus trap en modal.
5. Toast de éxito y error en cada mutación.
6. Estado loading (Skeleton) + error (toast) + empty (`EmptyState`).
7. Responsive verificado.

## Anti-patterns a rechazar

- `flex-direction: column` con text-nodes (`·`) como hijos directos → separadores huérfanos.
- Errores HTTP literales en la UI ("Error: 404").
- `setState` para forms que tienen RHF.
- `fetch()` sin TanStack Query (sin invalidación).
- Wizards con stepper Y nav lateral simultáneos.
- Charts dibujados a mano con SVG cuando hay librería.
- "Marketing copy" con icon-cards decorativos en flujos operativos.

## Agentes especializados aplicables

- [`frontend-developer`](../.github/agents/frontend-developer.agent.md) — owner por defecto.
- [`test-engineer`](../.github/agents/test-engineer.agent.md) — para tests con RTL + Playwright.
- [`spec-generator`](../.github/agents/spec-generator.agent.md) — antes de codificar.
- [`orchestrator`](../.github/agents/orchestrator.agent.md) — para validar gates ASSD.

## Lecturas obligatorias

- `Front-end/README.md`
- `../.github/specs/retail-inventory.spec.md`
- `../.github/docs/context/project_architecture_standards.context.md`
