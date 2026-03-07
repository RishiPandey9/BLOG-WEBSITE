'use client';

import { useSession } from 'next-auth/react';
import { type UserRole } from '@/types';
import { hasPermission, isManager, isViewer, getRoleLabel, getRoleBadgeColor } from '@/lib/rbac';
import type { Permission } from '@/types';

/**
 * Hook to access the current user's role and RBAC helpers
 */
export function useRole() {
  const { data: session, status } = useSession();

  const role = ((session?.user as { role?: UserRole })?.role ?? null) as UserRole | null;

  return {
    role,
    isManager: isManager(role),
    isViewer: isViewer(role),
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    label: getRoleLabel(role),
    badgeColor: getRoleBadgeColor(role),
    can: (permission: Permission) => (role ? hasPermission(role, permission) : false),
    session,
  };
}
