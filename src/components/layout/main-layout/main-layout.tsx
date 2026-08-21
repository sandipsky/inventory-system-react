import { useRef, type ReactNode } from 'react';
import { Header } from '../header/header';
import { HeaderBreadcrumb } from '../header/header-breadcrumb';
import { HeaderUser } from '../header/header-user';
import { Sidebar, type SidebarHandle } from '../sidebar/sidebar';
import './main-layout.css';

export interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const sidebar = useRef<SidebarHandle>(null);

  return (
    <div className="main-layout">
      <Sidebar ref={sidebar} />

      <div className="main-area">
        <Header onMenuToggle={() => sidebar.current?.toggle()}>
          <HeaderBreadcrumb />
          <HeaderUser />
        </Header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
