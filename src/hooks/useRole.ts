'use client';

import { useSession } from 'next-auth/react';
import { type UserRole } from '@/types';
import { hasPermission, isManager, isMainAdmin, isDelegatedAdmin, isViewer, getRoleLabel, getRoleBadgeColor } from '@/lib/rbac';
import type { Permission } from '@/types';

/**
 * Hook to access the current user's role and RBAC helpers
 */
export function useRole() {
  const { data: session, status } = useSession();

  const role = ((session?.user as { role?: UserRole })?.role ?? null) as UserRole | null;

  return {
    role,
    /** True for both permanent admins and delegated admins */
    isManager: isManager(role),
    /** True only for permanent admins (email in MANAGER_EMAILS) */
    isMainAdmin: isMainAdmin(role),
    /** True only for time-limited delegated admins */
    isDelegatedAdmin: isDelegatedAdmin(role),
    isViewer: isViewer(role),
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    label: getRoleLabel(role),
    badgeColor: getRoleBadgeColor(role),
    can: (permission: Permission) => (role ? hasPermission(role, permission) : false),
    session,
  };
}
