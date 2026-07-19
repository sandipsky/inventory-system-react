import type { ReactNode } from 'react';
import { LUITooltip } from '../../ui/tooltip/tooltip';
import './sidebar-item.css';

export interface LUISidebarItemProps {
  /** Leading icon; hidden label-only rendering when omitted. */
  icon?: ReactNode;
  /** Visible item text; also used as the tooltip when the rail is collapsed. */
  label: string;
  /** Highlights the item as the current selection (leaf items only). */
  active?: boolean;
  /**
   * When `true` the rail is collapsed: only the icon shows, so the label is
   * surfaced as a hover/focus tooltip on the right of the item.
   */
  collapsed?: boolean;
  /**
   * Group state: when the item has `children` it renders as a group header
   * with a chevron; `expanded` controls whether the children are shown.
   */
  expanded?: boolean;
  /** Leaf items: select. Group items: toggle `expanded`. */
  onClick?: () => void;
  /** Child items; providing them turns this item into a collapsible group. */
  children?: ReactNode;
}

/**
 * A single nav entry for the sidebar rail. Pass nested `LUISidebarItem`s as
 * `children` to render a collapsible group with a chevron (open/close it via
 * `expanded` + `onClick`). When the sidebar is collapsed on desktop only the
 * icon remains visible (the label is exposed via an `LUITooltip` on hover/focus).
 */
export function LUISidebarItem({
  icon,
  label,
  active = false,
  collapsed = false,
  expanded = false,
  onClick,
  children,
}: LUISidebarItemProps) {
  const isGroup = children != null;

  const classes = [
    'l-sidebar-item',
    active ? 'l-sidebar-item--active' : '',
    isGroup && expanded ? 'l-sidebar-item--expanded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const button = (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-expanded={isGroup ? expanded : undefined}
    >
      {icon != null && <span className="l-sidebar-item__icon">{icon}</span>}
      <span className="l-sidebar-item__label">{label}</span>
      {isGroup && (
        <svg
          className="l-sidebar-item__chevron"
          viewBox="0 0 20 20"
          width="14"
          height="14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7.5 5L12.5 10L7.5 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );

  // Collapsed rail hides the label, so reveal it as a tooltip on the right.
  const trigger = collapsed ? (
    <LUITooltip content={label} placement="right">
      {button}
    </LUITooltip>
  ) : (
    button
  );

  if (!isGroup) return trigger;

  const childrenClasses = [
    'l-sidebar-item__children',
    expanded ? 'l-sidebar-item__children--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="l-sidebar-item-group">
      {trigger}
      <div className={childrenClasses}>
        <div className="l-sidebar-item__children-inner">{children}</div>
      </div>
    </div>
  );
}
