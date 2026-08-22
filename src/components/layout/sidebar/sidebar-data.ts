export interface SidebarItemData {
  icon: string;
  label: string;
  to?: string;
  children?: readonly SidebarItemData[];
}

export const SIDEBAR_ITEMS: readonly SidebarItemData[] = [
  { icon: 'dashboard', label: 'Dashboard', to: '/' },
  {
    icon: 'sales-entry',
    label: 'Sales',
    children: [
      { icon: 'customer', label: 'Customer', to: '/sales/customer' },
      { icon: 'sales-entry', label: 'Sales Entry', to: '/sales/sales-entry' },
      { icon: 'sales-return', label: 'Sales Return', to: '/sales/sales-return' },
    ],
  },
  {
    icon: 'purchase-entry',
    label: 'Purchase',
    children: [
      { icon: 'purchase-entry', label: 'Purchase Entry', to: '/purchase/purchase-entry' },
      { icon: 'purchase-return', label: 'Purchase Return', to: '/purchase/purchase-return' },
      { icon: 'vendor', label: 'Vendor', to: '/purchase/vendor' },
    ],
  },
  {
    icon: 'inventory',
    label: 'Inventory',
    children: [
      { icon: 'opening-stock', label: 'Opening Stock', to: '/inventory/opening-stock' },
      { icon: 'stock-adjustment', label: 'Stock Adjustment', to: '/inventory/stock-adjustment' },
      { icon: 'stock-edit', label: 'Stock Edit', to: '/inventory/stock-edit' },
    ],
  },
  {
    icon: 'accounting',
    label: 'Accounting',
    children: [
      { icon: 'account', label: 'Account Master', to: '/accounting/account-master' },
      { icon: 'journal-entry', label: 'Journal Entry', to: '/accounting/journal-entry' },
      { icon: 'opening-balance', label: 'Opening Balance', to: '/accounting/opening-balance' },
      { icon: 'payment', label: 'Payment', to: '/accounting/payment' },
      { icon: 'payment-adjustment', label: 'Payment Adjustment', to: '/accounting/payment-adjustment' },
    ],
  },
  {
    icon: 'master',
    label: 'Setup',
    children: [
      { icon: 'category', label: 'Category', to: '/setup/category' },
      { icon: 'packing', label: 'Packing', to: '/setup/packing' },
      { icon: 'taxtype', label: 'Tax Type', to: '/setup/tax-type' },
      { icon: 'unit', label: 'Unit', to: '/setup/unit' },
    ],
  },
  { icon: 'products', label: 'Products', to: '/products' },
  { icon: 'reports', label: 'Reports', to: '/reports' },
  { icon: 'roles-permission', label: 'Roles & Permissions', to: '/roles-permissions' },
  { icon: 'users', label: 'Users', to: '/user' },
  { icon: 'settings', label: 'Settings', to: '/settings' },
];
