export type Action = 'Create' | 'Read' | 'Update' | 'Delete';

export type Module = 
  | 'Dashboard' 
  | 'Sales' 
  | 'Customers' 
  | 'Orders' 
  | 'Sales Returns' 
  | 'Exchanges' 
  | 'Category' 
  | 'Products' 
  | 'Branch' 
  | 'Stock Adjustments' 
  | 'HRM' 
  | 'Report' 
  | 'Wallet' 
  | 'Expense' 
  | 'Suppliers' 
  | 'Purchase' 
  | 'Promotional Banner' 
  | 'Ads' 
  | 'Promo Code' 
  | 'Push Notification' 
  | 'Blogs' 
  | 'Help Requests' 
  | 'Help Notes' 
  | 'Business Settings' 
  | 'CMS' 
  | '3rd Party Configuration';

export type RoleScope = 'Global (All Branches)' | 'Own Branch Only' | 'Own Data Only';

export interface RolePermission {
  module: Module;
  actions: Action[]; // which actions are allowed
}

export interface Role {
  id: string;
  name: string; // Admin, Salesperson, etc.
  description: string;
  scope: RoleScope;
  employeeCount: number;
  permissions: RolePermission[];
}
