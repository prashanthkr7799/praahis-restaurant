/**
 * Permissions Utilities Tests
 * Comprehensive tests for RBAC permission functions
 */
import { describe, it, expect } from 'vitest';
import {
  ROLES,
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canAccessAdmin,
  canAccessChef,
  canAccessWaiter,
  getDashboardRoute,
  getRoleDisplayName,
  getRoleBadgeColor,
} from './permissions';

describe('ROLES', () => {
  it('should define all expected roles', () => {
    expect(ROLES.ADMIN).toBe('admin');
    expect(ROLES.MANAGER).toBe('manager');
    expect(ROLES.CHEF).toBe('chef');
    expect(ROLES.WAITER).toBe('waiter');
    expect(ROLES.OWNER).toBe('owner');
  });

  it('should have 5 roles defined', () => {
    expect(Object.keys(ROLES)).toHaveLength(5);
  });
});

describe('PERMISSIONS', () => {
  it('should define menu permissions', () => {
    expect(PERMISSIONS.MENU_VIEW).toBe('menu:view');
    expect(PERMISSIONS.MENU_CREATE).toBe('menu:create');
    expect(PERMISSIONS.MENU_EDIT).toBe('menu:edit');
    expect(PERMISSIONS.MENU_DELETE).toBe('menu:delete');
  });

  it('should define order permissions', () => {
    expect(PERMISSIONS.ORDER_VIEW).toBe('order:view');
    expect(PERMISSIONS.ORDER_CREATE).toBe('order:create');
    expect(PERMISSIONS.ORDER_UPDATE).toBe('order:update');
    expect(PERMISSIONS.ORDER_DELETE).toBe('order:delete');
  });

  it('should define staff permissions', () => {
    expect(PERMISSIONS.STAFF_VIEW).toBe('staff:view');
    expect(PERMISSIONS.STAFF_CREATE).toBe('staff:create');
    expect(PERMISSIONS.STAFF_EDIT).toBe('staff:edit');
    expect(PERMISSIONS.STAFF_DELETE).toBe('staff:delete');
  });

  it('should define analytics permissions', () => {
    expect(PERMISSIONS.ANALYTICS_VIEW).toBe('analytics:view');
    expect(PERMISSIONS.REPORTS_VIEW).toBe('reports:view');
    expect(PERMISSIONS.REPORTS_EXPORT).toBe('reports:export');
  });
});

describe('hasPermission', () => {
  describe('admin role', () => {
    it('should have all permissions', () => {
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.MENU_VIEW)).toBe(true);
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.MENU_CREATE)).toBe(true);
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.MENU_DELETE)).toBe(true);
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.STAFF_DELETE)).toBe(true);
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.SETTINGS_EDIT)).toBe(true);
    });
  });

  describe('owner role', () => {
    it('should have all permissions', () => {
      expect(hasPermission(ROLES.OWNER, PERMISSIONS.MENU_VIEW)).toBe(true);
      expect(hasPermission(ROLES.OWNER, PERMISSIONS.STAFF_DELETE)).toBe(true);
      expect(hasPermission(ROLES.OWNER, PERMISSIONS.SETTINGS_EDIT)).toBe(true);
    });
  });

  describe('manager role', () => {
    it('should have menu view and create permissions', () => {
      expect(hasPermission(ROLES.MANAGER, PERMISSIONS.MENU_VIEW)).toBe(true);
      expect(hasPermission(ROLES.MANAGER, PERMISSIONS.MENU_CREATE)).toBe(true);
      expect(hasPermission(ROLES.MANAGER, PERMISSIONS.MENU_EDIT)).toBe(true);
    });

    it('should NOT have staff delete permission', () => {
      expect(hasPermission(ROLES.MANAGER, PERMISSIONS.STAFF_DELETE)).toBe(false);
    });

    it('should have analytics permissions', () => {
      expect(hasPermission(ROLES.MANAGER, PERMISSIONS.ANALYTICS_VIEW)).toBe(true);
      expect(hasPermission(ROLES.MANAGER, PERMISSIONS.REPORTS_VIEW)).toBe(true);
    });
  });

  describe('chef role', () => {
    it('should have menu view permission', () => {
      expect(hasPermission(ROLES.CHEF, PERMISSIONS.MENU_VIEW)).toBe(true);
    });

    it('should have order view and update permissions', () => {
      expect(hasPermission(ROLES.CHEF, PERMISSIONS.ORDER_VIEW)).toBe(true);
      expect(hasPermission(ROLES.CHEF, PERMISSIONS.ORDER_UPDATE)).toBe(true);
    });

    it('should NOT have menu create permission', () => {
      expect(hasPermission(ROLES.CHEF, PERMISSIONS.MENU_CREATE)).toBe(false);
    });

    it('should NOT have staff permissions', () => {
      expect(hasPermission(ROLES.CHEF, PERMISSIONS.STAFF_VIEW)).toBe(false);
    });
  });

  describe('waiter role', () => {
    it('should have menu view permission', () => {
      expect(hasPermission(ROLES.WAITER, PERMISSIONS.MENU_VIEW)).toBe(true);
    });

    it('should have order permissions', () => {
      expect(hasPermission(ROLES.WAITER, PERMISSIONS.ORDER_VIEW)).toBe(true);
      expect(hasPermission(ROLES.WAITER, PERMISSIONS.ORDER_CREATE)).toBe(true);
      expect(hasPermission(ROLES.WAITER, PERMISSIONS.ORDER_UPDATE)).toBe(true);
    });

    it('should have table view permission', () => {
      expect(hasPermission(ROLES.WAITER, PERMISSIONS.TABLE_VIEW)).toBe(true);
    });

    it('should NOT have analytics permissions', () => {
      expect(hasPermission(ROLES.WAITER, PERMISSIONS.ANALYTICS_VIEW)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for null role', () => {
      expect(hasPermission(null, PERMISSIONS.MENU_VIEW)).toBe(false);
    });

    it('should return false for undefined role', () => {
      expect(hasPermission(undefined, PERMISSIONS.MENU_VIEW)).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('invalid_role', PERMISSIONS.MENU_VIEW)).toBe(false);
    });

    it('should return false for empty string role', () => {
      expect(hasPermission('', PERMISSIONS.MENU_VIEW)).toBe(false);
    });
  });
});

describe('hasAnyPermission', () => {
  it('should return true if role has any of the permissions', () => {
    const permissions = [PERMISSIONS.MENU_VIEW, PERMISSIONS.STAFF_DELETE];
    expect(hasAnyPermission(ROLES.MANAGER, permissions)).toBe(true);
  });

  it('should return false if role has none of the permissions', () => {
    const permissions = [PERMISSIONS.STAFF_DELETE, PERMISSIONS.SETTINGS_EDIT];
    expect(hasAnyPermission(ROLES.WAITER, permissions)).toBe(false);
  });

  it('should return true for admin with any permissions', () => {
    const permissions = [PERMISSIONS.MENU_VIEW, PERMISSIONS.STAFF_DELETE];
    expect(hasAnyPermission(ROLES.ADMIN, permissions)).toBe(true);
  });

  it('should return false for null role', () => {
    expect(hasAnyPermission(null, [PERMISSIONS.MENU_VIEW])).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  it('should return true if role has all permissions', () => {
    const permissions = [PERMISSIONS.MENU_VIEW, PERMISSIONS.ORDER_VIEW];
    expect(hasAllPermissions(ROLES.ADMIN, permissions)).toBe(true);
  });

  it('should return false if role lacks any permission', () => {
    const permissions = [PERMISSIONS.MENU_VIEW, PERMISSIONS.STAFF_DELETE];
    expect(hasAllPermissions(ROLES.MANAGER, permissions)).toBe(false);
  });

  it('should return true for chef with their permissions', () => {
    const permissions = [PERMISSIONS.MENU_VIEW, PERMISSIONS.ORDER_VIEW, PERMISSIONS.ORDER_UPDATE];
    expect(hasAllPermissions(ROLES.CHEF, permissions)).toBe(true);
  });

  it('should return false for null role', () => {
    expect(hasAllPermissions(null, [PERMISSIONS.MENU_VIEW])).toBe(false);
  });
});

describe('getRolePermissions', () => {
  it('should return all permissions for admin', () => {
    const permissions = getRolePermissions(ROLES.ADMIN);
    expect(permissions).toContain(PERMISSIONS.MENU_VIEW);
    expect(permissions).toContain(PERMISSIONS.STAFF_DELETE);
    expect(permissions).toContain(PERMISSIONS.SETTINGS_EDIT);
  });

  it('should return limited permissions for waiter', () => {
    const permissions = getRolePermissions(ROLES.WAITER);
    expect(permissions).toContain(PERMISSIONS.MENU_VIEW);
    expect(permissions).toContain(PERMISSIONS.ORDER_VIEW);
    expect(permissions).not.toContain(PERMISSIONS.STAFF_DELETE);
  });

  it('should return empty array for invalid role', () => {
    const permissions = getRolePermissions('invalid');
    expect(permissions).toEqual([]);
  });

  it('should return empty array for null role', () => {
    const permissions = getRolePermissions(null);
    expect(permissions).toEqual([]);
  });
});

describe('canAccessAdmin', () => {
  it('should return true for admin', () => {
    expect(canAccessAdmin(ROLES.ADMIN)).toBe(true);
  });

  it('should return true for manager', () => {
    expect(canAccessAdmin(ROLES.MANAGER)).toBe(true);
  });

  it('should return false for chef', () => {
    expect(canAccessAdmin(ROLES.CHEF)).toBe(false);
  });

  it('should return false for waiter', () => {
    expect(canAccessAdmin(ROLES.WAITER)).toBe(false);
  });

  it('should return false for owner', () => {
    expect(canAccessAdmin(ROLES.OWNER)).toBe(false);
  });

  it('should return false for null', () => {
    expect(canAccessAdmin(null)).toBe(false);
  });
});

describe('canAccessChef', () => {
  it('should return true for admin', () => {
    expect(canAccessChef(ROLES.ADMIN)).toBe(true);
  });

  it('should return true for manager', () => {
    expect(canAccessChef(ROLES.MANAGER)).toBe(true);
  });

  it('should return true for chef', () => {
    expect(canAccessChef(ROLES.CHEF)).toBe(true);
  });

  it('should return false for waiter', () => {
    expect(canAccessChef(ROLES.WAITER)).toBe(false);
  });

  it('should return false for owner', () => {
    expect(canAccessChef(ROLES.OWNER)).toBe(false);
  });
});

describe('canAccessWaiter', () => {
  it('should return true for admin', () => {
    expect(canAccessWaiter(ROLES.ADMIN)).toBe(true);
  });

  it('should return true for manager', () => {
    expect(canAccessWaiter(ROLES.MANAGER)).toBe(true);
  });

  it('should return true for waiter', () => {
    expect(canAccessWaiter(ROLES.WAITER)).toBe(true);
  });

  it('should return false for chef', () => {
    expect(canAccessWaiter(ROLES.CHEF)).toBe(false);
  });

  it('should return false for owner', () => {
    expect(canAccessWaiter(ROLES.OWNER)).toBe(false);
  });
});

describe('getDashboardRoute', () => {
  it('should return /superadmin/dashboard for owner', () => {
    expect(getDashboardRoute(ROLES.OWNER)).toBe('/superadmin/dashboard');
  });

  it('should return /manager/dashboard for admin', () => {
    expect(getDashboardRoute(ROLES.ADMIN)).toBe('/manager/dashboard');
  });

  it('should return /manager/dashboard for manager', () => {
    expect(getDashboardRoute(ROLES.MANAGER)).toBe('/manager/dashboard');
  });

  it('should return /chef for chef', () => {
    expect(getDashboardRoute(ROLES.CHEF)).toBe('/chef');
  });

  it('should return /waiter for waiter', () => {
    expect(getDashboardRoute(ROLES.WAITER)).toBe('/waiter');
  });

  it('should return / for unknown role', () => {
    expect(getDashboardRoute('unknown')).toBe('/');
  });

  it('should return / for null', () => {
    expect(getDashboardRoute(null)).toBe('/');
  });
});

describe('getRoleDisplayName', () => {
  it('should return Owner for owner role', () => {
    expect(getRoleDisplayName(ROLES.OWNER)).toBe('Owner');
  });

  it('should return Administrator for admin role', () => {
    expect(getRoleDisplayName(ROLES.ADMIN)).toBe('Administrator');
  });

  it('should return Manager for manager role', () => {
    expect(getRoleDisplayName(ROLES.MANAGER)).toBe('Manager');
  });

  it('should return Chef for chef role', () => {
    expect(getRoleDisplayName(ROLES.CHEF)).toBe('Chef');
  });

  it('should return Waiter for waiter role', () => {
    expect(getRoleDisplayName(ROLES.WAITER)).toBe('Waiter');
  });

  it('should return role string for unknown role', () => {
    expect(getRoleDisplayName('custom_role')).toBe('custom_role');
  });
});

describe('getRoleBadgeColor', () => {
  it('should return black colors for owner', () => {
    const color = getRoleBadgeColor(ROLES.OWNER);
    expect(color).toContain('bg-black');
    expect(color).toContain('text-white');
  });

  it('should return purple colors for admin', () => {
    const color = getRoleBadgeColor(ROLES.ADMIN);
    expect(color).toContain('bg-purple');
    expect(color).toContain('text-purple');
  });

  it('should return blue colors for manager', () => {
    const color = getRoleBadgeColor(ROLES.MANAGER);
    expect(color).toContain('bg-blue');
    expect(color).toContain('text-blue');
  });

  it('should return orange colors for chef', () => {
    const color = getRoleBadgeColor(ROLES.CHEF);
    expect(color).toContain('bg-orange');
    expect(color).toContain('text-orange');
  });

  it('should return green colors for waiter', () => {
    const color = getRoleBadgeColor(ROLES.WAITER);
    expect(color).toContain('bg-green');
    expect(color).toContain('text-green');
  });

  it('should return gray colors for unknown role', () => {
    const color = getRoleBadgeColor('unknown');
    expect(color).toContain('bg-gray');
    expect(color).toContain('text-gray');
  });
});
