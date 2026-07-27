import type { ReactNode } from 'react';
import { LUIDrawerProvider } from '../ui/drawer';
import { LUISpinnerProvider } from '../ui/loading-spinner';
import { LUIModalProvider } from '../ui/modal';
import { LUINotificationProvider } from '../ui/notification/notification';

export interface LUIProviderProps {
  children?: ReactNode;
}

export function LUIProvider({ children }: LUIProviderProps) {
  return (
    <LUINotificationProvider>
      <LUISpinnerProvider>
        <LUIModalProvider>
          <LUIDrawerProvider>{children}</LUIDrawerProvider>
        </LUIModalProvider>
      </LUISpinnerProvider>
    </LUINotificationProvider>
  );
}
