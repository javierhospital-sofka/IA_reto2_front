import type { AuthUser, LoginResponse } from './contracts';
import { apiRequest } from './httpClient';

export function login(email: string, password: string) {
  return apiRequest<{ data: LoginResponse }>('core', '/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }).then((response) => response.data);
}

export function getMe() {
  return apiRequest<{ data: AuthUser }>('core', '/v1/auth/me').then((response) => ({
    user: response.data
  }));
}
