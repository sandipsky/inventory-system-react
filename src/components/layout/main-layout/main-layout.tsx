import { useRef, type ReactNode } from 'react';
import { useLoadConfigurations } from '@/features/settings/configuration/configuration.query';
import { Header } from '../header/header';
import { Sidebar, type SidebarHandle } from '../sidebar/sidebar';
import './main-layout.css';

export interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const sidebar = useRef<SidebarHandle>(null);

  useLoadConfigurations();

  return (
    <div className="main-layout">
      <Sidebar ref={sidebar} />

      <div className="main-area">
        <Header onMenuToggle={() => sidebar.current?.toggle()} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
