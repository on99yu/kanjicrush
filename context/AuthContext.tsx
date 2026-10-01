import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { loginToApp, logoutFromApp } from "../api/authApi";
import { AuthSession } from "../types/auth";
import { clearAuthSession, loadAuthSession, saveAuthSession } from "../utils/authStorage";

type AuthContextType = {
  session: AuthSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthSession()
      .then((stored) => {
        if (stored && new Date(stored.expiresAt).getTime() > Date.now()) {
          setSession(stored);
        } else if (stored) {
          return clearAuthSession();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const nextSession = await loginToApp(email.trim(), password);
    await saveAuthSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(async () => {
    const token = session?.token;
    setSession(null);
    await clearAuthSession();
    if (token) {
      try {
        await logoutFromApp(token);
      } catch {
        // 로컬 로그아웃은 유지하고 서버 세션은 만료 시 자동 정리한다.
      }
    }
  }, [session?.token]);

  const value = useMemo(
    () => ({ session, loading, login, logout }),
    [session, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
