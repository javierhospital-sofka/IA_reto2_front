import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { login as loginRequest } from '../../shared/api/authApi';
import type { AuthUser } from '../../shared/api/contracts';
import { setAccessToken } from '../../shared/api/httpClient';
import { clearSession, readSession, saveSession } from './authStorage';

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState(() => readSession());
  setAccessToken(session?.accessToken ?? null);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: session?.accessToken ?? null,
      user: session?.user ?? null,
      async login(email, password) {
        const response = await loginRequest(email, password);
        const nextSession = { accessToken: response.accessToken, user: response.user };
        saveSession(nextSession);
        setAccessToken(nextSession.accessToken);
        setSession(nextSession);
      },
      logout() {
        clearSession();
        setAccessToken(null);
        setSession(null);
      }
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
