import { useRef, useState, type ReactNode } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { LUIHeader } from '../header/header';
import { LUISidebar, type LUISidebarHandle } from '../sidebar/sidebar';
import { LUISidebarItem } from '../sidebar/sidebar-item';
import { SIDEBAR_ITEMS } from '../sidebar/sidebar-data';
import './main-layout.css';

export interface LUIMainLayoutProps {
  /** Rendered inside the header bar, next to the hamburger button. */
  header?: ReactNode;
  /**
   * Accordion behaviour for sidebar groups: `true` (default) closes the other
   * groups when one opens; `false` lets several stay open at once.
   */
  singleOpenGroup?: boolean;
  /** Page content rendered next to the sidebar, below the header. */
  children?: ReactNode;
}

/**
 * Full app shell: `LUISidebar` (looping {@link SIDEBAR_ITEMS} as
 * `LUISidebarItem`s — entries with `children` become collapsible groups)
 * beside a column of `LUIHeader` + content. The header's hamburger is
 * pre-wired to the sidebar's `toggle()`.
 */
export function LUIMainLayout({ header, singleOpenGroup = true, children }: LUIMainLayoutProps) {
  const sidebar = useRef<LUISidebarHandle>(null);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const goTo = (to?: string) => {
    if (to) navigate({ to });
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const isOpen = prev.includes(label);
      if (singleOpenGroup) return isOpen ? [] : [label];
      return isOpen ? prev.filter((l) => l !== label) : [...prev, label];
    });
  };

  return (
    <div className="l-main-layout">
      <LUISidebar ref={sidebar} collapsed={collapsed} onCollapsedChange={setCollapsed}>
        <div className="l-main-layout__brand">ABIS</div>
        <nav className="l-main-layout__nav">
          {SIDEBAR_ITEMS.map((item) =>
            item.children ? (
              <LUISidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                expanded={openGroups.includes(item.label)}
                onClick={() => toggleGroup(item.label)}
              >
                {item.children.map((child) => (
                  <LUISidebarItem
                    key={child.label}
                    icon={child.icon}
                    label={child.label}
                    collapsed={collapsed}
                    active={child.to === pathname}
                    onClick={() => goTo(child.to)}
                  />
                ))}
              </LUISidebarItem>
            ) : (
              <LUISidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                active={item.to === pathname}
                onClick={() => goTo(item.to)}
              />
            ),
          )}
        </nav>
      </LUISidebar>

      <div className="l-main-layout__main">
        <LUIHeader onMenuToggle={() => sidebar.current?.toggle()}>{header}</LUIHeader>
        <main className="l-main-layout__content">{children}</main>
      </div>
    </div>
  );
}
