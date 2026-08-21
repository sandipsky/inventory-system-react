import type { ComponentPropsWithRef } from 'react';
import { HeaderBreadcrumb } from './components/header-breadcrumb';
import { HeaderCalculator } from './components/header-calculator';
import { HeaderNotification } from './components/header-notification';
import { HeaderPrint } from './components/header-print';
import { HeaderUser } from './components/header-user';
import './header.css';

export interface HeaderProps extends ComponentPropsWithRef<'header'> {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle, className, ...rest }: HeaderProps) {
  return (
    <header className={['header', className ?? ''].filter(Boolean).join(' ')} {...rest}>
      <button
        type="button"
        className="menu-button"
        aria-label="Toggle sidebar"
        onClick={() => onMenuToggle?.()}
      >
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="header-content">
        <HeaderBreadcrumb />

        <div className="header-actions">
          <HeaderPrint />
          <HeaderCalculator />
          <HeaderNotification />
          <HeaderUser />
        </div>
      </div>
    </header>
  );
}
