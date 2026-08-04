import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Always ping /me (not just when a token is in localStorage) so an
    // HttpOnly-cookie session survives a page reload too.
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (username, fullname, email, password) => {
      const data = await authApi.register(username, fullname, email, password);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data.user);
    },
    [],
  );

  // Used by the OAuth callback page: tokens arrive as URL query params rather
  // than through a form submit, so this bypasses authApi.login().
  const loginWithTokens = useCallback(async (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token') ?? '';
    try {
      await authApi.logout(refreshToken);
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await authApi.me();
      setUser(fresh);
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithTokens,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
