/**
 * Role-Based Access Control (RBAC) Permissions
 * Defines what each role can do in the system
 */

// Role hierarchy
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CHEF: 'chef',
  WAITER: 'waiter',
  OWNER: 'owner',
};

// Permission definitions
export const PERMISSIONS = {
  // Menu Management
  MENU_VIEW: 'menu:view',
  MENU_CREATE: 'menu:create',
  MENU_EDIT: 'menu:edit',
  MENU_DELETE: 'menu:delete',

  // Order Management
  ORDER_VIEW: 'order:view',
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',

  // Staff Management
  STAFF_VIEW: 'staff:view',
  STAFF_CREATE: 'staff:create',
  STAFF_EDIT: 'staff:edit',
  STAFF_DELETE: 'staff:delete',

  // Offers Management
  OFFER_VIEW: 'offer:view',
  OFFER_CREATE: 'offer:create',
  OFFER_EDIT: 'offer:edit',
  OFFER_DELETE: 'offer:delete',

  // Analytics & Reports
  ANALYTICS_VIEW: 'analytics:view',
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',

  // Activity Logs
  LOGS_VIEW: 'logs:view',

  // Payments
  PAYMENTS_VIEW: 'payments:view',
  PAYMENTS_MANAGE: 'payments:manage',

  // QR Codes
  QR_VIEW: 'qr:view',
  QR_MANAGE: 'qr:manage',

  // Tables
  TABLE_VIEW: 'table:view',
  TABLE_MANAGE: 'table:manage',
};

// Role-Permission mapping
const rolePermissions = {
  [ROLES.ADMIN]: [
    // All permissions
    ...Object.values(PERMISSIONS),
  ],

  // Platform owner has full access across tenants in owner portal
  [ROLES.OWNER]: [
    ...Object.values(PERMISSIONS),
  ],

  [ROLES.MANAGER]: [
    // Menu
    PERMISSIONS.MENU_VIEW,
    PERMISSIONS.MENU_CREATE,
    PERMISSIONS.MENU_EDIT,
    // Orders
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    // Staff (view only)
    PERMISSIONS.STAFF_VIEW,
    // Offers
    PERMISSIONS.OFFER_VIEW,
    PERMISSIONS.OFFER_CREATE,
    PERMISSIONS.OFFER_EDIT,
    // Analytics & Reports
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    // Settings (view only)
    PERMISSIONS.SETTINGS_VIEW,
    // Payments
    PERMISSIONS.PAYMENTS_VIEW,
    // QR & Tables
    PERMISSIONS.QR_VIEW,
    PERMISSIONS.TABLE_VIEW,
  ],

  [ROLES.CHEF]: [
    // Menu (view only)
    PERMISSIONS.MENU_VIEW,
    // Orders
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
  ],

  [ROLES.WAITER]: [
    // Menu (view only)
    PERMISSIONS.MENU_VIEW,
    // Orders
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    // Tables
    PERMISSIONS.TABLE_VIEW,
  ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some((permission) => hasPermission(userRole, permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every((permission) => hasPermission(userRole, permission));
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role) => {
  return rolePermissions[role] || [];
};

/**
 * Check if role can access admin portal
 */
export const canAccessAdmin = (role) => {
  return [ROLES.ADMIN, ROLES.MANAGER].includes(role);
};

/**
 * Check if role can access chef dashboard
 */
export const canAccessChef = (role) => {
  return [ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF].includes(role);
};

/**
 * Check if role can access waiter dashboard
 */
export const canAccessWaiter = (role) => {
  return [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER].includes(role);
};

/**
 * Get dashboard route for role
 */
export const getDashboardRoute = (role) => {
  switch (role) {
    case ROLES.OWNER:
      return '/superadmin/dashboard';
    case ROLES.ADMIN:
      // Admins use the manager portal UI in this app
      return '/manager/dashboard';
    case ROLES.MANAGER:
      return '/manager/dashboard';
    case ROLES.CHEF:
      return '/chef';
    case ROLES.WAITER:
      return '/waiter';
    default:
      return '/';
  }
};

/**
 * Role display names
 */
export const getRoleDisplayName = (role) => {
  const displayNames = {
    [ROLES.OWNER]: 'Owner',
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.CHEF]: 'Chef',
    [ROLES.WAITER]: 'Waiter',
  };
  return displayNames[role] || role;
};

/**
 * Role badge colors
 */
export const getRoleBadgeColor = (role) => {
  const colors = {
    [ROLES.OWNER]: 'bg-black text-white border-gray-800',
    [ROLES.ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
    [ROLES.MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200',
    [ROLES.CHEF]: 'bg-orange-100 text-orange-800 border-orange-200',
    [ROLES.WAITER]: 'bg-green-100 text-green-800 border-green-200',
  };
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
};
