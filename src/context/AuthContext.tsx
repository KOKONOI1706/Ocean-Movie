import React, { createContext, useContext, useState, useEffect } from 'react';
import { userApi } from '../lib/api/user.api';
import { apiClient } from '../lib/api/client';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Rehydrate the session on load — a token in localStorage means the user
  // was logged in on a previous visit, so restore `user` instead of quietly
  // dropping back to a logged-out UI on every refresh.
  useEffect(() => {
    const storedToken = localStorage.getItem('bienphim_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    setToken(storedToken);
    userApi
      .getMe()
      .then((me) => setUser(me))
      .catch(() => {
        // Stored token is invalid/expired — clear it rather than staying in
        // a half-logged-in state (token present but no user).
        apiClient.clearToken();
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const res = await userApi.login(identifier, password);
      if (res.accessToken) {
        setToken(res.accessToken);
        localStorage.setItem('bienphim_token', res.accessToken);
        // fetch user profile
        const me = await userApi.getMe();
        setUser(me);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; username: string; password: string; displayName: string }) => {
    setLoading(true);
    try {
      const res = await userApi.register(data);
      if (res.accessToken) {
        setToken(res.accessToken);
        localStorage.setItem('bienphim_token', res.accessToken);
        const me = await userApi.getMe();
        setUser(me);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await userApi.logout();
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('bienphim_token');
      setLoading(false);
    }
  };

  // Re-fetch the current user — used after a profile edit so the header,
  // profile page, etc. all reflect the new displayName/avatar immediately.
  const refreshUser = async () => {
    const me = await userApi.getMe();
    setUser(me);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
