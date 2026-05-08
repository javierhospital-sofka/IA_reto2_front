# ASSD Spec (Frontend slice): Local Docker Runtime

> Spec global de referencia: [`../../.github/specs/local-docker-runtime.spec.md`](../../.github/specs/local-docker-runtime.spec.md)

## Contexto

La SPA se construye dentro del compose y se sirve por Vite preview (o nginx en prod). El compose vive en `Backend/docker-compose.yml`; este repo aporta el `Dockerfile` de la SPA y la configuración del `apiClient` para apuntar al servicio interno.

## Alcance

Incluye:
- `Dockerfile` multistage: build → preview server.
- `vite.config.ts` con `server.host=0.0.0.0` y `preview.host=0.0.0.0`.
- Variables de entorno baked at build time (`VITE_API_INVENTORY_URL`, `VITE_API_CORE_URL`).
- Healthcheck del container.

No incluye:
- Servir la SPA con nginx (alternativa documentada).
- CDN o cache HTTP customizado.

## Variables de entorno

| Var | Uso | Default local | Default compose |
|---|---|---|---|
| `VITE_API_INVENTORY_URL` | Base URL del inventory-service | `http://localhost:3001` | `http://localhost:3001` (host port) |
| `VITE_API_CORE_URL` | Base URL del core-retail-service | `http://localhost:3002` | `http://localhost:3002` |
| `VITE_DEV_PORT` | Puerto interno | 5173 | 5173 → host 5174 |

## Criterios de aceptación (frontend slice)

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| LR-1-FE | Stack arriba | abrir `http://localhost:5174` | Render de `/login` |
| LR-2-FE | Login válido | submit | Redirect a `/inventario` con dashboard |
| LR-3-FE | Backend down | refresh `/inventario` | Toast "API no disponible" (no crash) |
| LR-4-FE | Container | healthcheck | 200 OK en puerto interno |

## Trazabilidad (frontend)

| Criterio | Implementación | Test |
|---|---|---|
| LR-1-FE, LR-2-FE | `Dockerfile` + compose `front-end` service | smoke manual |
| LR-3-FE | `getApiErrorMessage` global | `getApiErrorMessage.test.ts` |
| LR-4-FE | Healthcheck en `docker-compose.yml` | smoke manual |

## Pruebas

- Smoke manual: `docker compose up -d --build` + abrir `http://localhost:5174`.
- E2E Playwright corre contra `vite dev` (no contra el container — más rápido y predecible).

## Riesgos y supuestos

- En compose, las URLs apuntan a `localhost:3001/3002` (host network desde el navegador). En producción se usaría DNS interno o reverse proxy.
- Build size: bundle Vite < 1 MB gzip (recharts es la dependencia más pesada).
