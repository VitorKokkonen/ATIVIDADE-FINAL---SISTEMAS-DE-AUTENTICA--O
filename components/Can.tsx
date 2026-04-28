"use client";

import { useAuth, Role } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface CanProps {
  role: Role | Role[];
  children: ReactNode;
}

export function Can({ role, children }: CanProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
