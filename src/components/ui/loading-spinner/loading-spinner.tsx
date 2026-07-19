import { useLUISpinner } from './spinner-provider';
import './loading-spinner.css';

/**
 * Full-screen loading overlay driven by `useLUISpinner()`. Place one instance
 * near the app root (inside `LUISpinnerProvider`); call `show()` / `hide()`
 * from anywhere to toggle it.
 *
 * ```tsx
 * <LUILoadingSpinner />
 * ```
 */
export function LUILoadingSpinner() {
  const spinner = useLUISpinner();

  if (!spinner.visible) return null;

  return (
    <div className="l-spinner-overlay">
      <div className="l-spinner-wheel"></div>
    </div>
  );
}
