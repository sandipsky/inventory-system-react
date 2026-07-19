import type { ReactNode } from 'react';
import { LUIDrawerProvider } from '../ui/drawer';
import { LUISpinnerProvider } from '../ui/loading-spinner';
import { LUIModalProvider } from '../ui/modal';
import { LUINotificationProvider } from '../ui/notification/notification';

export interface LUIProviderProps {
  children?: ReactNode;
}

/**
 * All-in-one LumenUI provider — mounts every library context (notification,
 * spinner, modal, drawer) so the `useLUI*()` hooks work anywhere below it.
 * Mount once near the app root, like Mantine's `MantineProvider`:
 *
 * ```tsx
 * <LUIProvider>
 *   <App />
 * </LUIProvider>
 * ```
 *
 * The individual providers remain exported for apps that only want a subset.
 */
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
