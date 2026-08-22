export interface SidebarItemData {
  icon: string;
  label: string;
  to?: string;
  /** View operation(s) required to show the item; any one suffices. Omit = always visible. */
  permission?: string | readonly string[];
  children?: readonly SidebarItemData[];
}

export const SIDEBAR_ITEMS: readonly SidebarItemData[] = [
  { icon: 'dashboard', label: 'Dashboard', to: '/' },
  {
    icon: 'sales-entry',
    label: 'Sales',
    children: [
      { icon: 'customer', label: 'Customer', to: '/sales/customer', permission: 'ViewCustomer' },
      { icon: 'sales-entry', label: 'Sales Entry', to: '/sales/sales-entry', permission: 'ViewSalesEntries' },
      { icon: 'sales-return', label: 'Sales Return', to: '/sales/sales-return', permission: 'ViewSalesReturns' },
    ],
  },
  {
    icon: 'purchase-entry',
    label: 'Purchase',
    children: [
      { icon: 'purchase-entry', label: 'Purchase Entry', to: '/purchase/purchase-entry', permission: 'ViewPurchaseEntry' },
      { icon: 'purchase-return', label: 'Purchase Return', to: '/purchase/purchase-return', permission: 'ViewPurchaseReturn' },
      { icon: 'vendor', label: 'Vendor', to: '/purchase/vendor', permission: 'ViewVendor' },
    ],
  },
  {
    icon: 'inventory',
    label: 'Inventory',
    children: [
      { icon: 'opening-stock', label: 'Opening Stock', to: '/inventory/opening-stock', permission: 'ViewOpeningStock' },
      { icon: 'stock-adjustment', label: 'Stock Adjustment', to: '/inventory/stock-adjustment', permission: 'ViewStockAdjustment' },
      { icon: 'stock-edit', label: 'Stock Edit', to: '/inventory/stock-edit', permission: 'ViewStockEdit' },
    ],
  },
  {
    icon: 'accounting',
    label: 'Accounting',
    children: [
      { icon: 'account', label: 'Account Master', to: '/accounting/account-master', permission: 'ViewAccountMaster' },
      { icon: 'journal-entry', label: 'Journal Entry', to: '/accounting/journal-entry', permission: 'ViewJournalEntries' },
      { icon: 'opening-balance', label: 'Opening Balance', to: '/accounting/opening-balance', permission: 'ViewOpeningBalance' },
      { icon: 'payment', label: 'Payment', to: '/accounting/payment', permission: ['ViewVendorPayment', 'ViewCustomerPayment'] },
      { icon: 'payment-adjustment', label: 'Payment Adjustment', to: '/accounting/payment-adjustment', permission: 'ViewPaymentAdjustment' },
    ],
  },
  {
    icon: 'master',
    label: 'Setup',
    children: [
      { icon: 'category', label: 'Category', to: '/setup/category', permission: 'ViewCategory' },
      { icon: 'packing', label: 'Packing', to: '/setup/packing', permission: 'ViewPacking' },
      { icon: 'taxtype', label: 'Tax Type', to: '/setup/tax-type', permission: 'ViewTaxType' },
      { icon: 'unit', label: 'Unit', to: '/setup/unit', permission: 'ViewUnit' },
    ],
  },
  { icon: 'products', label: 'Products', to: '/products', permission: 'ViewProduct' },
  { icon: 'reports', label: 'Reports', to: '/reports' },
  { icon: 'roles-permission', label: 'Roles & Permissions', to: '/roles-permissions', permission: 'ViewRole' },
  { icon: 'users', label: 'Users', to: '/user', permission: 'ViewUser' },
  { icon: 'settings', label: 'Settings', to: '/settings', permission: ['ViewConfiguration', 'ViewDocumentNumbering'] },
];
