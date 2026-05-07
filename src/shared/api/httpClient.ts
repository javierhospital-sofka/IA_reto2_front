import { coreApiUrl, inventoryApiUrl } from './config';

export type ApiTarget = 'core' | 'inventory';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function apiRequest<T>(
  target: ApiTarget,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const baseUrl = target === 'core' ? coreApiUrl : inventoryApiUrl;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      payload?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      payload?.error?.code
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
