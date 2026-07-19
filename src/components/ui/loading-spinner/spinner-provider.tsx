import { createContext, useContext, useState, type ReactNode } from 'react';

/**
 * Drives the global `LUILoadingSpinner` overlay. Call `show()`/`hide()` around
 * async work. Calls are reference-counted, so overlapping operations keep the
 * overlay up until the last one finishes:
 *
 * ```ts
 * const spinner = useLUISpinner();
 * spinner.show();
 * try {
 *   await loadData();
 * } finally {
 *   spinner.hide();
 * }
 * ```
 */
export interface LUISpinnerApi {
  /** True while at least one caller is showing the spinner. */
  visible: boolean;
  /** Show the overlay (increments the pending count). */
  show(): void;
  /** Hide one pending request; the overlay stays up until all are cleared. */
  hide(): void;
  /** Force the overlay off regardless of pending count. */
  reset(): void;
}

const SpinnerContext = createContext<LUISpinnerApi | null>(null);

/** Global spinner hook — requires a mounted {@link LUISpinnerProvider}. */
export function useLUISpinner(): LUISpinnerApi {
  const api = useContext(SpinnerContext);
  if (!api) {
    throw new Error('useLUISpinner() must be used within an <LUISpinnerProvider>.');
  }
  return api;
}

/**
 * Holds the reference-counted pending state for the global loading overlay.
 * Mount once near the app root (with one `<LUILoadingSpinner />` inside it),
 * then toggle the overlay from anywhere via {@link useLUISpinner}.
 */
export function LUISpinnerProvider({ children }: { children?: ReactNode }) {
  const [pending, setPending] = useState(0);

  const api: LUISpinnerApi = {
    visible: pending > 0,
    show: () => setPending((count) => count + 1),
    hide: () => setPending((count) => Math.max(0, count - 1)),
    reset: () => setPending(0),
  };

  return <SpinnerContext.Provider value={api}>{children}</SpinnerContext.Provider>;
}
