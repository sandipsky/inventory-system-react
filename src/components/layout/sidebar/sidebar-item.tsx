import type { ReactNode } from 'react';
import { LUITooltip } from '../../ui/tooltip/tooltip';
import './sidebar-item.css';
import { LUIIcon } from '@/components/ui/icon/icon';

export interface SidebarItemProps {
  icon?: ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  expanded?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

export function SidebarItem({
  icon,
  label,
  active = false,
  collapsed = false,
  expanded = false,
  onClick,
  children,
}: SidebarItemProps) {
  const isGroup = children != null;

  const classes = ['sidebar-item', active ? 'active' : '', isGroup && expanded ? 'expanded' : '']
    .filter(Boolean)
    .join(' ');

  const button = (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-expanded={isGroup ? expanded : undefined}
    >
      {icon != null && <LUIIcon name={icon as string} />}
      <span className="item-label">{label}</span>
      {isGroup && (
        <svg
          className="item-chevron"
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

  const trigger = collapsed ? (
    <LUITooltip content={label} placement="right">
      {button}
    </LUITooltip>
  ) : (
    button
  );

  if (!isGroup) return trigger;

  return (
    <div className="sidebar-group">
      {trigger}
      <div className={expanded ? 'group-children open' : 'group-children'}>
        <div className="group-children-inner">{children}</div>
      </div>
    </div>
  );
}
