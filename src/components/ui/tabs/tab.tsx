import { createContext, use, type ReactNode } from 'react';
import './tab.css';

/** @internal Ids and active state assigned to a tab by its parent {@link LUITabs}. */
export interface TabContextValue {
  tabId: string;
  panelId: string;
  active: boolean;
}

export const TabContext = createContext<TabContextValue | null>(null);

export interface LUITabProps {
  /** Strip label. */
  label?: string;
  /** Optional leading glyph/emoji. */
  icon?: string;
  /** Explicit value bound to `LUITabs` `value`. Defaults to the tab's index. */
  value?: unknown;
  /** Disable the tab; it is skipped by arrow-key navigation. */
  disabled?: boolean;
  /** Panel content, shown while the tab is active. */
  children?: ReactNode;
}

/**
 * A single tab inside {@link LUITabs}. Carries the strip label (`label`/`icon`)
 * and renders its panel content (`children`). The parent tab set owns the
 * active state and reads `label`/`icon`/`value`/`disabled` straight off this
 * element — `LUITab` must be a direct child of `LUITabs`.
 */
export function LUITab({ children }: LUITabProps) {
  const tab = use(TabContext);
  if (!tab) {
    throw new Error('LUITab must be rendered inside LUITabs');
  }

  return (
    <div className="l-tab">
      <div
        className={['l-tab__panel', tab.active ? 'is-active' : ''].filter(Boolean).join(' ')}
        role="tabpanel"
        id={tab.panelId}
        aria-labelledby={tab.tabId}
        hidden={!tab.active}
        inert={!tab.active}
      >
        {children}
      </div>
    </div>
  );
}
