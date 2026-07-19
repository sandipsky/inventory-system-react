import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { LUITab, TabContext, type LUITabProps } from './tab';
import './tabs.css';

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsVariant = 'line' | 'pills';
export type TabsSize = 'sm' | 'md' | 'lg';

/** Geometry of the sliding indicator behind/under the active tab. */
interface IndicatorState {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface LUITabsProps {
  orientation?: TabsOrientation;
  variant?: TabsVariant;
  size?: TabsSize;
  /** Stretch horizontal tabs to fill the width in equal parts. */
  grow?: boolean;
  /**
   * The active tab's `value` (or its index when no `value` was given).
   * Controlled when provided — pair with `onChange`. Omit for uncontrolled
   * use; the selection then defaults to the first enabled tab.
   */
  value?: unknown;
  /** Called with the newly active tab's value when the user selects a tab. */
  onChange?: (value: unknown) => void;
  /** Alias of `onChange` — port of the Angular `activeChange` output. */
  onActiveChange?: (value: unknown) => void;
  className?: string;
  /** `LUITab` children — the strip renders from their `label`/`icon`. */
  children?: ReactNode;
}

/**
 * Tab set with a sliding active indicator, laid out `horizontal` (default) or
 * `vertical`. Give it {@link LUITab} children — the container renders the tab
 * strip from their `label`/`icon` and shows the active tab's panel:
 *
 * ```tsx
 * <LUITabs value={tab} onChange={setTab} orientation="vertical">
 *   <LUITab label="Profile" icon="👤">…</LUITab>
 *   <LUITab label="Settings" icon="⚙️">…</LUITab>
 *   <LUITab label="Archived" disabled>…</LUITab>
 * </LUITabs>
 * ```
 *
 * Active state is the `value` prop (a tab's `value`, falling back to its
 * index) — controlled with `value` + `onChange`, or uncontrolled when `value`
 * is omitted. Follows the WAI-ARIA tabs pattern with roving arrow-key
 * navigation.
 */
export function LUITabs({
  orientation = 'horizontal',
  variant = 'line',
  size = 'md',
  grow = false,
  value: valueProp,
  onChange,
  onActiveChange,
  className,
  children,
}: LUITabsProps) {
  const baseId = useId();
  const hostRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  /* The tab strip is rendered from the LUITab children's props, in order. */
  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<LUITabProps> => isValidElement(child) && child.type === LUITab,
  );

  const tabId = (index: number): string => `l-tab-${baseId}-${index}`;
  const panelId = (index: number): string => `${tabId(index)}-panel`;

  /** A tab's value, falling back to its index when none was given. */
  const valueOf = (index: number): unknown => {
    const value = tabs[index].props.value;
    return value === undefined || value === null ? index : value;
  };

  const [internalValue, setInternalValue] = useState<unknown>(null);
  const rawValue = valueProp !== undefined ? valueProp : internalValue;
  /* Default the selection to the first enabled tab (Angular did this on registration). */
  const firstEnabled = tabs.findIndex((tab) => !tab.props.disabled);
  const activeValue = rawValue ?? (firstEnabled >= 0 ? valueOf(firstEnabled) : null);

  const isActive = (index: number): boolean => valueOf(index) === activeValue;

  const select = (index: number): void => {
    const tab = tabs[index];
    if (!tab || tab.props.disabled) return;
    const value = valueOf(index);
    if (value === activeValue) return;
    setInternalValue(value);
    onChange?.(value);
    onActiveChange?.(value);
  };

  const nextEnabled = (from: number, direction: number): number => {
    const count = tabs.length;
    for (let step = 1; step <= count; step++) {
      const index = (from + direction * step + count * 2) % count;
      if (!tabs[index].props.disabled) return index;
    }
    return -1;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const vertical = orientation === 'vertical';
    let target: number;
    switch (event.key) {
      case vertical ? 'ArrowDown' : 'ArrowRight':
        target = nextEnabled(index, 1);
        break;
      case vertical ? 'ArrowUp' : 'ArrowLeft':
        target = nextEnabled(index, -1);
        break;
      case 'Home':
        target = nextEnabled(-1, 1);
        break;
      case 'End':
        target = nextEnabled(tabs.length, -1);
        break;
      default:
        return;
    }
    if (target < 0) return;
    event.preventDefault();
    select(target);
    buttonsRef.current[target]?.focus();
  };

  /* ── Sliding indicator ─────────────────────────────────────── */
  const [indicator, setIndicator] = useState<IndicatorState>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });
  /* Gate the slide transition until after first paint so it never flashes from 0,0. */
  const [ready, setReady] = useState(false);

  const positionIndicator = (): void => {
    const index = tabs.findIndex((_, i) => isActive(i));
    const button = buttonsRef.current[index];
    if (index < 0 || !button) {
      setIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const line = variant === 'line';
    const thickness = 2;
    let geometry: { x: number; y: number; width: number; height: number };

    if (line && orientation === 'horizontal') {
      geometry = {
        x: button.offsetLeft,
        y: button.offsetTop + button.offsetHeight - thickness,
        width: button.offsetWidth,
        height: thickness,
      };
    } else if (line) {
      geometry = {
        x: button.offsetLeft + button.offsetWidth - thickness,
        y: button.offsetTop,
        width: thickness,
        height: button.offsetHeight,
      };
    } else {
      /* pills — full button rect */
      geometry = {
        x: button.offsetLeft,
        y: button.offsetTop,
        width: button.offsetWidth,
        height: button.offsetHeight,
      };
    }

    setIndicator((prev) =>
      prev.visible &&
      prev.x === geometry.x &&
      prev.y === geometry.y &&
      prev.width === geometry.width &&
      prev.height === geometry.height
        ? prev
        : { ...geometry, visible: true },
    );
  };

  /* Reposition after every commit — anything that can move the active tab or
     resize the strip (value, tabs, orientation, variant, size, grow) lands
     here; the bail-out inside positionIndicator keeps it from looping. */
  useLayoutEffect(() => {
    positionIndicator();
  });

  /* Latest closure for the ResizeObserver, which is created once on mount. */
  const positionRef = useRef(positionIndicator);
  useEffect(() => {
    positionRef.current = positionIndicator;
  });

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    const observer = new ResizeObserver(() => positionRef.current());
    if (hostRef.current) observer.observe(hostRef.current);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  const hostClasses = [
    'l-tabs',
    `l-tabs--${orientation}`,
    `l-tabs--${variant}`,
    `l-tabs--${size}`,
    grow ? 'l-tabs--grow' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={hostRef} className={hostClasses}>
      <div className="l-tabs__list" role="tablist" aria-orientation={orientation}>
        {tabs.map((tab, i) => {
          const active = isActive(i);
          return (
            <button
              key={tab.key ?? i}
              ref={(el) => {
                buttonsRef.current[i] = el;
              }}
              type="button"
              role="tab"
              className={['l-tabs__tab', active ? 'is-active' : ''].filter(Boolean).join(' ')}
              id={tabId(i)}
              disabled={tab.props.disabled}
              aria-selected={active}
              aria-controls={panelId(i)}
              tabIndex={active ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(event) => onKeyDown(event, i)}
            >
              {tab.props.icon && (
                <span className="l-tabs__icon" aria-hidden="true">
                  {tab.props.icon}
                </span>
              )}
              <span className="l-tabs__label">{tab.props.label}</span>
            </button>
          );
        })}

        <span
          className={[
            'l-tabs__indicator',
            indicator.visible ? 'is-visible' : '',
            ready ? 'is-ready' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            width: indicator.width,
            height: indicator.height,
            transform: `translate(${indicator.x}px,${indicator.y}px)`,
          }}
          aria-hidden="true"
        />
      </div>

      <div className="l-tabs__panels">
        {tabs.map((tab, i) => (
          <TabContext
            key={tab.key ?? i}
            value={{ tabId: tabId(i), panelId: panelId(i), active: isActive(i) }}
          >
            {tab}
          </TabContext>
        ))}
      </div>
    </div>
  );
}
