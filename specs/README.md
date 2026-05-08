# Specs ASSD — Front-end

Slices ASSD aplicados al stack frontend (React 19 + Vite + RHF + Zod + recharts). La autoridad cross-stack vive en [`.github/specs/`](../../.github/specs/); estos archivos son la **vista del frontend** sobre cada spec global.

## Archivos

- [`retail-inventory-ui.spec.md`](retail-inventory-ui.spec.md) — 6 rutas operativas, formularios, charts, tablas, toasts, paginación
- [`auth-bearer-token.spec.md`](auth-bearer-token.spec.md) — login UI, `PrivateRoute`, persistencia de token
- [`local-docker-runtime.spec.md`](local-docker-runtime.spec.md) — SPA dentro del compose

## Cómo trabajarlas

1. Leer la spec global en `.github/specs/`.
2. Leer la spec local (criterios `RI-*-FE`, `AT-*-FE`, etc.).
3. Implementar respetando la trazabilidad criterio ↔ componente ↔ test.
4. Cualquier cambio en la global debe reflejarse aquí en la misma PR.

## Rutas funcionales

- `/login` — pública
- `/inventario` — privada (dashboard)
- `/inventories/:id/products` — privada
- `/inventories/:id/movements` — privada
- `/inventories/:id/optimization` — privada
- `/inventories/:id/alerts` — privada

Todas las rutas privadas pasan por `<PrivateRoute />` y envían `Authorization: Bearer <token>`.
