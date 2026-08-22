import { useEffect, useImperativeHandle, useState, type Ref } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuthStore } from '@/features/auth';
import { SidebarItem } from './sidebar-item';
import { SIDEBAR_ITEMS, type SidebarItemData } from './sidebar-data';
import './sidebar.css';

/** Keep in sync with the media query in sidebar.css. */
const MOBILE_BREAKPOINT = '(max-width: 768px)';

export interface SidebarHandle {
  toggle: () => void;
}

export interface SidebarProps {
  ref?: Ref<SidebarHandle>;
}

export function Sidebar({ ref }: SidebarProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const operations = useAuthStore((s) => s.operations);

  const canView = (item: SidebarItemData) =>
    !item.permission ||
    (Array.isArray(item.permission)
      ? item.permission.some((operation) => operations.includes(operation))
      : operations.includes(item.permission as string));

  const visibleItems = SIDEBAR_ITEMS.map((item) =>
    item.children ? { ...item, children: item.children.filter(canView) } : item,
  ).filter((item) => (item.children ? item.children.length > 0 : canView(item)));

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  /* Start with the group that owns the current route expanded. */
  const [openGroup, setOpenGroup] = useState<string | null>(
    () =>
      SIDEBAR_ITEMS.find((item) => item.children?.some((child) => child.to === pathname))?.label ??
      null,
  );
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_BREAKPOINT).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      if (!event.matches) setMobileOpen(false);
    };
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isMobile || !mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobile, mobileOpen]);

  useImperativeHandle(ref, () => ({
    toggle: () => {
      if (isMobile) setMobileOpen((open) => !open);
      else setCollapsed((value) => !value);
    },
  }));

  const goTo = (to?: string) => {
    if (to) navigate({ to });
  };

  const classes = ['sidebar', collapsed ? 'collapsed' : '', mobileOpen ? 'open' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {isMobile && mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <div className="sidebar-panel">
        <div className="sidebar-brand">ABIS</div>

        <div className="sidebar-nav">
          {visibleItems.map((item) =>
            item.children ? (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                expanded={openGroup === item.label}
                /* Show where the active page lives whenever its child list is hidden. */
                active={
                  item.children.some((child) => child.to === pathname) &&
                  (collapsed || openGroup !== item.label)
                }
                onClick={() => setOpenGroup(openGroup === item.label ? null : item.label)}
              >
                {item.children.map((child) => (
                  <SidebarItem
                    key={child.label}
                    icon={child.icon}
                    label={child.label}
                    collapsed={collapsed}
                    active={child.to === pathname}
                    onClick={() => goTo(child.to)}
                  />
                ))}
              </SidebarItem>
            ) : (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                active={item.to === pathname}
                onClick={() => goTo(item.to)}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
