# CLAUDE.md — Frontend (inventario-retail-web)

Instrucciones para **Claude Code** dentro de este repo. Para la convención Codex / Copilot ver [`AGENTS.md`](AGENTS.md).

## Contexto

SPA React 19 + Vite + TypeScript estricto. Stack:

- React Router 7 + PrivateRoute
- TanStack Query 5
- React Hook Form + Zod
- recharts (charts reales)
- lucide-react

## Subagentes locales

`.claude/agents/` contiene los agentes restringidos al stack frontend:

- `@frontend-dev` — componentes, rutas, formularios, charts
- `@frontend-test` — Vitest + Testing Library + Playwright (cuando se incorpore)

## Reglas duras

1. **Cero `window.alert/confirm`** — usar `Toast` y `ConfirmDialog`.
2. **Cero errores HTTP crudos** — pasar por `getApiErrorMessage(error)`.
3. **Validación Zod** en todo formulario (`useForm({ resolver: zodResolver })`).
4. **Versionado optimista**: enviar `expectedVersion` desde el cache; manejar 409 con toast accionable.
5. **A11y mínimo**: `aria-label`, `aria-live`, `aria-invalid`, `<label htmlFor>`, `<th scope="col">`.
6. **Charts con recharts**, no SVG manual.
7. **Forms densos**, no "PowerPoint" decorativo.

## Comandos

```bash
npm install
npm run dev          # 5173 dentro del container, 5174 en host
npm test             # 32 specs
npm run typecheck
npm run build
npm run coverage     # thresholds 80/70
```

## Antes de tocar código

1. Leer la spec global en `../.github/specs/<feature>.spec.md` (autoridad cross-stack).
2. Leer la spec slice frontend en [`specs/<feature>.spec.md`](specs/) — criterios sufijados `-FE`.
3. Leer este `CLAUDE.md` y [`AGENTS.md`](AGENTS.md).
4. Identificar la ruta o componente owner.
5. Planear tests con Testing Library + mocks del API client cubriendo `RI-X-FE`, `AT-X-FE`, `LR-X-FE`.

## Definition of Done

- ✅ `npm run typecheck` limpio.
- ✅ `npm test` 100% verde.
- ✅ A11y: labels, roles, focus trap.
- ✅ Toast en éxito/error de cada mutación.
- ✅ Loading (Skeleton) + error (toast) + empty (`EmptyState`).
- ✅ Responsive verificado.

## Anti-patterns

- `flex-direction: column` con text-nodes (`·`) como hijos directos.
- Errores HTTP literales ("Error: 404") en la UI.
- `setState` para forms con RHF.
- `fetch()` sin TanStack Query.
- Wizards con stepper Y nav lateral simultáneos.

## Lecturas obligatorias

- [`README.md`](README.md)
- [`AGENTS.md`](AGENTS.md)
- [`specs/README.md`](specs/README.md) — índice de specs slice frontend
- [`specs/retail-inventory-ui.spec.md`](specs/retail-inventory-ui.spec.md) — slice frontend del flujo principal
- [`specs/auth-bearer-token.spec.md`](specs/auth-bearer-token.spec.md) — slice frontend de auth
- [`specs/local-docker-runtime.spec.md`](specs/local-docker-runtime.spec.md) — slice frontend del runtime
- `../.github/specs/` — specs globales / cross-stack (autoridad)
