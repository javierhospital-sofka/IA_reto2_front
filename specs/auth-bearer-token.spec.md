# ASSD Spec (Frontend slice): Auth Bearer Token

> Spec global de referencia: [`../../.github/specs/auth-bearer-token.spec.md`](../../.github/specs/auth-bearer-token.spec.md)

## Contexto

UI de login + guard de rutas privadas + persistencia local del token + interceptor del cliente HTTP que adjunta `Authorization: Bearer <token>` a todas las llamadas `/v1/*`.

## Alcance

Incluye:
- Página `/login` con form RHF + Zod (email + password).
- `PrivateRoute` que redirige a `/login` si no hay token.
- Persistencia del token en `localStorage` (clave `retail.auth.token`).
- Hook `useAuth()` con `login()`, `logout()`, `currentUser`.
- Cliente HTTP agrega `Authorization` automáticamente.
- Botón "Cerrar sesión" en sidebar.
- Manejo de 401: limpiar token + redirect a login + toast "sesión expirada".

No incluye:
- Recovery, MFA, OAuth (fuera del brief).
- "Recordarme" / refresh tokens.

## Reglas (vista frontend)

1. Token vive solo en `localStorage`. Nunca en cookies (no hay backend session).
2. Cliente HTTP NO loguea el token.
3. 401 desde cualquier endpoint → reset auth + redirect a `/login`.
4. `/login` redirige a `/inventario` si ya hay token válido.
5. Form de login con `aria-invalid` + mensaje en error.

## Componentes clave

| Componente | Responsabilidad |
|---|---|
| `LoginPage` | Form login + llamada a `POST /v1/auth/login` |
| `PrivateRoute` | Outlet guard por presencia de token |
| `AuthProvider` / `useAuth` | Estado global de auth |
| `apiClient` (fetch wrapper) | Interceptor 401 + Authorization header |

## Criterios de aceptación (frontend slice)

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| AT-1-FE | Credenciales válidas | submit `LoginPage` | Token guardado + redirect a `/inventario` + toast bienvenida |
| AT-2-FE | Credenciales inválidas | submit `LoginPage` | Toast "credenciales inválidas" + form re-habilitado |
| AT-3-FE | Sin token | navegar a ruta privada | Redirect a `/login` (preserva `from` para volver) |
| AT-4-FE | Token presente | navegar a `/login` | Redirect a `/inventario` |
| AT-5-FE | API responde 401 en mutación | catch global | Limpiar token + toast "sesión expirada" + redirect login |
| AT-6-FE | Click "Cerrar sesión" | logout | Limpiar token + redirect login + toast "sesión cerrada" |
| AT-7-FE | Form con campos vacíos | submit | Mensajes inline accesibles (RHF + Zod) |

## Trazabilidad (frontend)

| Criterio | Implementación | Test |
|---|---|---|
| AT-1-FE, AT-2-FE, AT-7-FE | `LoginPage` + RHF + Zod | `LoginPage.test.tsx` |
| AT-3-FE, AT-4-FE | `PrivateRoute` | `PrivateRoute.test.tsx` |
| AT-5-FE | `apiClient` interceptor 401 | `apiClient.test.ts` |
| AT-6-FE | `useAuth().logout()` + sidebar button | smoke manual |

## Pruebas

- `LoginPage.test.tsx` — form validation + happy path + error path.
- `PrivateRoute.test.tsx` — redirect sin token, render con token.
- `apiClient.test.ts` — interceptor 401, header Authorization presente.
- E2E Playwright login → dashboard.

## Riesgos y supuestos

- Token en `localStorage` es vulnerable a XSS. Aceptable en demo local; en producción usar httpOnly cookie + backend session.
- Sin refresh token — el usuario re-inicia sesión cada 2h (expiresIn del backend).
