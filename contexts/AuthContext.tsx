"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/me');
        setUser(data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    const handleTokenRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent;
      api.defaults.headers.common['Authorization'] = `Bearer ${customEvent.detail}`;
    };

    const handleForceLogout = () => {
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      router.push('/login');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('token_refreshed', handleTokenRefreshed);
      window.addEventListener('force_logout', handleForceLogout);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('token_refreshed', handleTokenRefreshed);
        window.removeEventListener('force_logout', handleForceLogout);
      }
    };
  }, [router]);

  const login = (token: string, userData: User) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = async () => {
    try {
      // You can add a call to /api/auth/logout if needed to clear the refresh token cookie
    } catch(e) {}
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
