// lib/admin/permissions.js

export const Permission = {
  // User management
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  BAN_USERS: 'ban_users',
  DELETE_USERS: 'delete_users',
  
  // Product management
  VIEW_PRODUCTS: 'view_products',
  CREATE_PRODUCTS: 'create_products',
  EDIT_PRODUCTS: 'edit_products',
  DELETE_PRODUCTS: 'delete_products',
  BULK_IMPORT: 'bulk_import',
  
  // Content moderation
  VIEW_REPORTS: 'view_reports',
  MODERATE_REVIEWS: 'moderate_reviews',
  MODERATE_CONTENT: 'moderate_content',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  
  // System settings
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_ADMINS: 'manage_admins',
  VIEW_LOGS: 'view_logs',
  
  // AI management
  MANAGE_AI_SETTINGS: 'manage_ai_settings',
  VIEW_AI_COSTS: 'view_ai_costs',
};

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.values(Permission),
  
  ADMIN: [
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.BAN_USERS,
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    Permission.DELETE_PRODUCTS,
    Permission.BULK_IMPORT,
    Permission.VIEW_REPORTS,
    Permission.MODERATE_REVIEWS,
    Permission.MODERATE_CONTENT,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.VIEW_LOGS,
  ],
  
  MODERATOR: [
    Permission.VIEW_USERS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_REPORTS,
    Permission.MODERATE_REVIEWS,
    Permission.MODERATE_CONTENT,
  ],
  
  ANALYST: [
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_USERS,
  ],
  
  SUPPORT: [
    Permission.VIEW_USERS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_REPORTS,
  ],
};

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function checkPermissions(role, permissions) {
  return permissions.every(p => hasPermission(role, p));
}