import { ApiError } from '../api/httpClient';
import { getApiErrorMessage } from './getApiErrorMessage';

describe('getApiErrorMessage', () => {
  it('maps CONFLICT to a version-aware message', () => {
    const error = new ApiError('expected 1, current 2', 409, 'CONFLICT');
    const result = getApiErrorMessage(error);
    expect(result.title).toMatch(/conflicto/i);
    expect(result.description).toMatch(/recarga/i);
  });

  it('maps NOT_FOUND for missing inventories with a clearer message', () => {
    const error = new ApiError('Inventory not found: abc', 404, 'NOT_FOUND');
    const result = getApiErrorMessage(error);
    expect(result.title).toMatch(/no encontrado/i);
    expect(result.description).toMatch(/abrir la tienda/i);
  });

  it('maps BAD_REQUEST to a validation hint', () => {
    const error = new ApiError('Invalid', 400, 'BAD_REQUEST');
    const result = getApiErrorMessage(error);
    expect(result.title).toMatch(/datos inválidos/i);
  });

  it('falls back to a generic message for plain Errors', () => {
    expect(getApiErrorMessage(new Error('boom')).description).toBe('boom');
  });

  it('returns a generic title when error is not an Error instance', () => {
    expect(getApiErrorMessage('weird').title).toMatch(/no se pudo/i);
  });
});
