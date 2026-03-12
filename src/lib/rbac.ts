import { ROLE_PERMISSIONS, type UserRole, type Permission } from '@/types';

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
}

/**
 * Check if a role has manager-level access (permanent or delegated).
 */
export function isManager(role?: string | null): boolean {
  return role === 'manager' || role === 'delegated_admin';
}

/**
 * Check if a role is the permanent/main admin (email in MANAGER_EMAILS).
 * Only main admins can grant or revoke delegated access.
 */
export function isMainAdmin(role?: string | null): boolean {
  return role === 'manager';
}

/**
 * Check if a role is a time-limited delegated admin.
 */
export function isDelegatedAdmin(role?: string | null): boolean {
  return role === 'delegated_admin';
}

/**
 * Check if a role is 'viewer'
 */
export function isViewer(role?: string | null): boolean {
  return role === 'viewer';
}

/**
 * Get a display-friendly role label
 */
export function getRoleLabel(role?: string | null): string {
  switch (role) {
    case 'manager':
      return 'Admin';
    case 'delegated_admin':
      return 'Delegated Admin';
    case 'viewer':
      return 'Viewer';
    default:
      return 'Guest';
  }
}

/**
 * Get role badge color classes
 */
export function getRoleBadgeColor(role?: string | null): string {
  switch (role) {
    case 'manager':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'delegated_admin':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300';
    case 'viewer':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-600';
  }
}
