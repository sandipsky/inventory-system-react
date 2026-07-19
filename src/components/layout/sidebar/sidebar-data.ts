/** Shape of one sidebar nav entry rendered by `LUISidebarItem`. */
export interface SidebarItemData {
  icon: string;
  label: string;
  /** Route path this entry navigates to. Omitted for group headers. */
  to?: string;
  /** Providing children turns the entry into a collapsible group. */
  children?: readonly SidebarItemData[];
}

/** Nav entries mirroring the `src/features` folder, looped over by `LUIMainLayout`. */
export const SIDEBAR_ITEMS: readonly SidebarItemData[] = [
  { icon: '📊', label: 'Dashboard', to: '/' },
  {
    icon: '🛒',
    label: 'Sales',
    children: [
      { icon: '👤', label: 'Customer', to: '/sales/customer' },
      { icon: '🧾', label: 'Sales Entry', to: '/sales/sales-entry' },
      { icon: '↩️', label: 'Sales Return', to: '/sales/sales-return' },
    ],
  },
  {
    icon: '📥',
    label: 'Purchase',
    children: [
      { icon: '🧾', label: 'Purchase Entry', to: '/purchase/purchase-entry' },
      { icon: '↩️', label: 'Purchase Return', to: '/purchase/purchase-return' },
      { icon: '🏭', label: 'Vendor', to: '/purchase/vendor' },
    ],
  },
  {
    icon: '📦',
    label: 'Inventory',
    children: [
      { icon: '📋', label: 'Opening Stock', to: '/inventory/opening-stock' },
      { icon: '🔧', label: 'Stock Adjustment', to: '/inventory/stock-adjustment' },
      { icon: '✏️', label: 'Stock Edit', to: '/inventory/stock-edit' },
    ],
  },
  {
    icon: '💰',
    label: 'Accounting',
    children: [
      { icon: '📒', label: 'Account Master', to: '/accounting/account-master' },
      { icon: '📝', label: 'Journal Entry', to: '/accounting/journal-entry' },
      { icon: '⚖️', label: 'Opening Balance', to: '/accounting/opening-balance' },
      { icon: '💵', label: 'Payment', to: '/accounting/payment' },
      { icon: '🔁', label: 'Payment Adjustment', to: '/accounting/payment-adjustment' },
    ],
  },
  {
    icon: '⚙️',
    label: 'Setup',
    children: [
      { icon: '🏷️', label: 'Category', to: '/setup/category' },
      { icon: '📐', label: 'Packing', to: '/setup/packing' },
      { icon: '📦', label: 'Products', to: '/setup/products' },
      { icon: '💹', label: 'Tax Type', to: '/setup/tax-type' },
      { icon: '📏', label: 'Unit', to: '/setup/unit' },
    ],
  },
  { icon: '📈', label: 'Reports', to: '/reports' },
  { icon: '🔐', label: 'Roles & Permissions', to: '/roles-permissions' },
  { icon: '👥', label: 'Users', to: '/user' },
  { icon: '🔧', label: 'Settings', to: '/settings' },
];
