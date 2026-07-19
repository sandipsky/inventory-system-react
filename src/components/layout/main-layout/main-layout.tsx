import { useRef, useState, type ReactNode } from 'react';
import { LUIHeader } from '../header/header';
import { LUISidebar, type LUISidebarHandle } from '../sidebar/sidebar';
import { LUISidebarItem } from '../sidebar/sidebar-item';
import { SIDEBAR_ITEMS } from '../sidebar/sidebar-data';
import './main-layout.css';

export interface LUIMainLayoutProps {
  /** Rendered inside the header bar, next to the hamburger button. */
  header?: ReactNode;
  /** Page content rendered next to the sidebar, below the header. */
  children?: ReactNode;
}

/**
 * Full app shell: `LUISidebar` (looping {@link SIDEBAR_ITEMS} as
 * `LUISidebarItem`s) beside a column of `LUIHeader` + content. The header's
 * hamburger is pre-wired to the sidebar's `toggle()`.
 */
export function LUIMainLayout({ header, children }: LUIMainLayoutProps) {
  const sidebar = useRef<LUISidebarHandle>(null);
  const [activeItem, setActiveItem] = useState(SIDEBAR_ITEMS[0]?.label);

  return (
    <div className="l-main-layout">
      <LUISidebar ref={sidebar}>
        <div className="l-main-layout__brand">L</div>
        <nav className="l-main-layout__nav">
          {SIDEBAR_ITEMS.map((item) => (
            <LUISidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={item.label === activeItem}
              onClick={() => setActiveItem(item.label)}
            />
          ))}
        </nav>
      </LUISidebar>

      <div className="l-main-layout__main">
        <LUIHeader onMenuToggle={() => sidebar.current?.toggle()}>{header}</LUIHeader>
        <main className="l-main-layout__content">{children}</main>
      </div>
    </div>
  );
}
