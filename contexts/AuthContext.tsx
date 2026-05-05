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
  login: (userData: User) => void;
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

    const handleForceLogout = () => {
      setUser(null);
      router.push('/login');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('force_logout', handleForceLogout);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('force_logout', handleForceLogout);
      }
    };
  }, [router]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    setUser(null);
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
