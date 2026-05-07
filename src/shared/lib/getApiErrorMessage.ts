/**
 * Translate ApiError instances into user-actionable Spanish messages.
 *
 * The backend returns `{ error: { code, message, details? } }`. The HTTP
 * client lifts `code` and `message` onto ApiError, so this helper keeps the
 * UI free from raw HTTP status numbers and Zod paths.
 */

import { ApiError } from '../api/httpClient';

interface ErrorInfo {
  title: string;
  description?: string;
}

export function getApiErrorMessage(error: unknown): ErrorInfo {
  if (!(error instanceof ApiError)) {
    if (error instanceof Error && error.message) {
      return { title: 'No se pudo completar la operación', description: error.message };
    }
    return { title: 'No se pudo completar la operación' };
  }

  switch (error.code) {
    case 'BAD_REQUEST':
      return {
        title: 'Datos inválidos',
        description: error.message || 'Revisa los campos resaltados e intenta nuevamente.'
      };
    case 'UNAUTHORIZED':
      return {
        title: 'Sesión expirada',
        description: 'Inicia sesión nuevamente para continuar.'
      };
    case 'FORBIDDEN':
      return {
        title: 'No autorizado',
        description: 'Tu rol no permite ejecutar esta acción.'
      };
    case 'NOT_FOUND':
      return {
        title: 'Recurso no encontrado',
        description:
          error.message.includes('Inventory not found')
            ? 'Este inventario ya no existe en el entorno local. Vuelve a abrir la tienda.'
            : error.message
      };
    case 'CONFLICT':
      return {
        title: 'Conflicto de versión',
        description:
          'Otro usuario actualizó este inventario antes que tú. Recarga la página y vuelve a intentar.'
      };
    case 'UPSTREAM_UNAVAILABLE':
      return {
        title: 'Servicio externo no disponible',
        description: 'Inténtalo nuevamente en unos segundos.'
      };
    default:
      return {
        title: 'No se pudo completar la operación',
        description: error.message || `Estado HTTP ${error.status}`
      };
  }
}
