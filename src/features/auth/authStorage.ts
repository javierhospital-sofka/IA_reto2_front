import type { AuthUser } from '../../shared/api/contracts';

const STORAGE_KEY = 'retail-auth-session';

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export function readSession(): AuthSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}
