/** Shape of one sidebar nav entry rendered by `LUISidebarItem`. */
export interface SidebarItemData {
  icon: string;
  label: string;
}

/** Mock nav entries looped over by `LUIMainLayout`. */
export const SIDEBAR_ITEMS: readonly SidebarItemData[] = [
  { icon: '📊', label: 'Dashboard' },
  { icon: '👥', label: 'Users' },
  { icon: '📁', label: 'Projects' },
  { icon: '📈', label: 'Reports' },
  { icon: '🔔', label: 'Notifications' },
  { icon: '⚙️', label: 'Settings' },
];
