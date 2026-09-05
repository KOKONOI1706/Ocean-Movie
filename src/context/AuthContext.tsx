import React, { createContext, useContext, useState, useEffect } from 'react';
import { userApi } from '../lib/api/user.api';
import { UserTasteProfile } from '../types';

interface AuthContextType {
  user: UserTasteProfile | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
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
  const [user, setUser] = useState<UserTasteProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('bienphim_token');
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
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

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
