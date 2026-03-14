import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasPermission, isManager, isViewer, getRoleLabel, getRoleBadgeColor } from '../rbac';
import { UserRole, ROLE_PERMISSIONS } from '@/types';

describe('RBAC Functions', () => {
  describe('hasPermission', () => {
    it('should return true for valid manager permission', () => {
      expect(hasPermission('manager', 'post:create')).toBe(true);
      expect(hasPermission('manager', 'comment:moderate')).toBe(true);
      expect(hasPermission('manager', 'user:manage')).toBe(true);
    });

    it('should return true for valid viewer permission', () => {
      expect(hasPermission('viewer', 'post:read')).toBe(true);
      expect(hasPermission('viewer', 'comment:create')).toBe(true);
      expect(hasPermission('viewer', 'post:like')).toBe(true);
    });

    it('should return false for manager permission requested by viewer', () => {
      expect(hasPermission('viewer', 'post:delete')).toBe(false);
      expect(hasPermission('viewer', 'comment:moderate')).toBe(false);
      expect(hasPermission('viewer', 'user:manage')).toBe(false);
    });

    it('should return false for invalid permission', () => {
      expect(hasPermission('manager', 'invalid:permission' as any)).toBe(false);
      expect(hasPermission('viewer', 'admin:access' as any)).toBe(false);
    });

    it('should throw for invalid role', () => {
      expect(() => hasPermission('invalid' as UserRole, 'post:create')).toThrow();
    });
  });

  describe('isManager', () => {
    it('should return true for manager role', () => {
      expect(isManager('manager')).toBe(true);
    });

    it('should return false for viewer role', () => {
      expect(isManager('viewer')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isManager(null)).toBe(false);
      expect(isManager(undefined)).toBe(false);
    });

    it('should return false for invalid role string', () => {
      expect(isManager('admin')).toBe(false);
      expect(isManager('editor')).toBe(false);
    });
  });

  describe('isViewer', () => {
    it('should return true for viewer role', () => {
      expect(isViewer('viewer')).toBe(true);
    });

    it('should return false for manager role', () => {
      expect(isViewer('manager')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isViewer(null)).toBe(false);
      expect(isViewer(undefined)).toBe(false);
    });
  });

  describe('getRoleLabel', () => {
    it('should return correct label for manager', () => {
      expect(getRoleLabel('manager')).toBe('Admin');
    });

    it('should return correct label for viewer', () => {
      expect(getRoleLabel('viewer')).toBe('Viewer');
    });

    it('should return Guest for null/undefined', () => {
      expect(getRoleLabel(null)).toBe('Guest');
      expect(getRoleLabel(undefined)).toBe('Guest');
    });

    it('should return Guest for invalid role', () => {
      expect(getRoleLabel('admin')).toBe('Guest');
    });
  });

  describe('getRoleBadgeColor', () => {
    it('should return correct color classes for manager', () => {
      const result = getRoleBadgeColor('manager');
      expect(result).toContain('bg-amber-100');
      expect(result).toContain('text-amber-800');
    });

    it('should return correct color classes for viewer', () => {
      const result = getRoleBadgeColor('viewer');
      expect(result).toContain('bg-sky-100');
      expect(result).toContain('text-sky-800');
    });

    it('should return gray color classes for guest', () => {
      const result = getRoleBadgeColor(null);
      expect(result).toContain('bg-gray-100');
      expect(result).toContain('text-gray-600');
    });
  });

  describe('ROLE_PERMISSIONS Consistency', () => {
    it('should have all expected manager permissions', () => {
      const managerPerms = ROLE_PERMISSIONS.manager;
      expect(managerPerms).toContain('post:create');
      expect(managerPerms).toContain('post:edit');
      expect(managerPerms).toContain('post:delete');
      expect(managerPerms).toContain('post:publish');
      expect(managerPerms).toContain('user:manage');
      expect(managerPerms).toContain('comment:moderate');
      expect(managerPerms).toContain('admin:access');
    });

    it('should have all expected viewer permissions', () => {
      const viewerPerms = ROLE_PERMISSIONS.viewer;
      expect(viewerPerms).toContain('post:read');
      expect(viewerPerms).toContain('post:submit');
      expect(viewerPerms).toContain('comment:create');
      expect(viewerPerms).toContain('post:like');
      expect(viewerPerms).toContain('post:bookmark');
    });

    it('should keep manager and viewer permission sets distinct', () => {
      const managerHasAllViewerPerms = ROLE_PERMISSIONS.viewer.every(perm =>
        ROLE_PERMISSIONS.manager.includes(perm)
      );
      expect(managerHasAllViewerPerms).toBe(false);
    });
  });
});
