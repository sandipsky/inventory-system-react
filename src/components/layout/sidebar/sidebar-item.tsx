import type { ReactNode } from 'react';
import './sidebar-item.css';

export interface LUISidebarItemProps {
  /** Leading icon; hidden label-only rendering when omitted. */
  icon?: ReactNode;
  /** Visible item text; also used as the tooltip when the rail is collapsed. */
  label: string;
  /** Highlights the item as the current selection. */
  active?: boolean;
  onClick?: () => void;
}

/**
 * A single nav entry for the sidebar rail. When the sidebar is collapsed on
 * desktop only the icon remains visible (the label is exposed via `title`).
 */
export function LUISidebarItem({ icon, label, active = false, onClick }: LUISidebarItemProps) {
  const classes = ['l-sidebar-item', active ? 'l-sidebar-item--active' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} title={label} onClick={onClick}>
      {icon != null && <span className="l-sidebar-item__icon">{icon}</span>}
      <span className="l-sidebar-item__label">{label}</span>
    </button>
  );
}
