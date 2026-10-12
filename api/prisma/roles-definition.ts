import { PermissionScope, ModuleName, PermissionAction } from '@prisma/client';

export interface RoleDefinition {
  name: string;
  scope: PermissionScope;
  isSystem: boolean;
  description?: string;
  isAllowed: (module: ModuleName, action: PermissionAction) => boolean;
}

export const SEED_ROLES: RoleDefinition[] = [
  {
    name: 'Admin',
    scope: PermissionScope.GLOBAL,
    isSystem: true,
    description: 'Super Administrator with unrestricted access to all modules and configurations',
    isAllowed: () => true,
  },
  {
    name: 'Branch Admin',
    scope: PermissionScope.OWN_BRANCH,
    isSystem: true,
    description: 'Branch administrator managing store operations within assigned branch',
    isAllowed: (module) => !['BUSINESS_SETTINGS', 'THIRD_PARTY_CONFIG', 'CMS'].includes(module),
  },
  {
    name: 'Branch Manager',
    scope: PermissionScope.OWN_BRANCH,
    isSystem: true,
    description: 'Branch manager overseeing branch sales, inventory, and staff',
    isAllowed: (module) => !['BUSINESS_SETTINGS', 'THIRD_PARTY_CONFIG', 'CMS'].includes(module),
  },
  {
    name: 'Salesperson',
    scope: PermissionScope.OWN_BRANCH,
    isSystem: true,
    description: 'Counter sales and POS cashier with read-only branch lookup and no branch mutation rights',
    isAllowed: (module, action) => {
      if (['SALES', 'ORDERS', 'CUSTOMERS', 'PRODUCTS'].includes(module) && action !== 'DELETE') return true;
      if (module === 'BRANCH' && (action === 'READ' || action === 'VIEW_DETAILS')) return true;
      if (module === 'DASHBOARD' && (action === 'READ' || action === 'VIEW_DETAILS')) return true;
      return false;
    },
  },
  {
    name: 'Purchase Manager',
    scope: PermissionScope.GLOBAL,
    isSystem: true,
    description: 'Procurement manager handling vendor relations and purchase orders',
    isAllowed: (module, action) => {
      if (['PURCHASE', 'SUPPLIERS', 'PRODUCTS'].includes(module)) return true;
      if (module === 'DASHBOARD' && (action === 'READ' || action === 'VIEW_DETAILS')) return true;
      return false;
    },
  },
  {
    name: 'Product Uploader',
    scope: PermissionScope.GLOBAL,
    isSystem: true,
    description: 'Catalog specialist managing products and categories without delete access',
    isAllowed: (module, action) => {
      if (['PRODUCTS', 'CATEGORY'].includes(module) && action !== 'DELETE') return true;
      if (module === 'DASHBOARD' && (action === 'READ' || action === 'VIEW_DETAILS')) return true;
      return false;
    },
  },
  {
    name: 'Customer Service',
    scope: PermissionScope.GLOBAL,
    isSystem: true,
    description: 'Support representative answering inquiries and managing support tickets',
    isAllowed: (module, action) => {
      if (['HELP_REQUESTS', 'HELP_NOTES', 'ORDERS', 'CUSTOMERS'].includes(module)) return true;
      if (module === 'DASHBOARD' && (action === 'READ' || action === 'VIEW_DETAILS')) return true;
      return false;
    },
  },
  {
    name: 'Technician',
    scope: PermissionScope.OWN_BRANCH,
    isSystem: true,
    description: 'Hardware repair technician managing service jobs and workshop diagnosing queue',
    isAllowed: (module, action) => {
      if (module === 'SALES' && ['READ', 'UPDATE', 'CREATE', 'VIEW_DETAILS'].includes(action)) return true;
      if (module === 'ORDERS' && ['READ', 'UPDATE', 'CREATE', 'VIEW_DETAILS'].includes(action)) return true;
      if (module === 'PRODUCTS' && ['READ', 'VIEW_DETAILS'].includes(action)) return true;
      if (module === 'DASHBOARD' && ['READ', 'VIEW_DETAILS'].includes(action)) return true;
      return false;
    },
  },
  {
    name: 'SEO',
    scope: PermissionScope.GLOBAL,
    isSystem: true,
    description: 'Marketing and content manager for CMS banners, blogs, and discount promo codes',
    isAllowed: (module, action) => {
      if (['CMS', 'PROMOTIONAL_BANNER', 'ADS', 'PROMO_CODE', 'BLOGS'].includes(module)) return true;
      if (module === 'DASHBOARD' && (action === 'READ' || action === 'VIEW_DETAILS')) return true;
      return false;
    },
  },
  {
    name: 'Inventory Auditor',
    scope: PermissionScope.OWN_BRANCH,
    isSystem: false,
    description: 'Auditor with read-only inspection access for products, stock adjustments, and purchases',
    isAllowed: (module, action) => {
      if (module === 'PRODUCTS' && ['READ', 'VIEW_DETAILS'].includes(action)) return true;
      if (module === 'STOCK_ADJUSTMENTS' && ['READ', 'VIEW_DETAILS'].includes(action)) return true;
      if (module === 'PURCHASE' && ['READ', 'VIEW_DETAILS'].includes(action)) return true;
      if (module === 'DASHBOARD' && ['READ', 'VIEW_DETAILS'].includes(action)) return true;
      return false;
    },
  },
];
