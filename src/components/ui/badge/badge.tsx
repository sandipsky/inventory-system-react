import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentPropsWithRef,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import './badge.css';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface LUIBadgeProps {
  count?: number | null;
  /** Any CSS color or token; empty falls back to the default red shade. */
  color?: string;
  size?: BadgeSize;
  overflowCount?: number;
  showZero?: boolean;
  /** Play a pop animation whenever the count changes. */
  dynamic?: boolean;
  /** Fires when the badge bubble is clicked (does not propagate to the host). */
  onClicked?: (event: ReactMouseEvent<HTMLSpanElement>) => void;
}

/**
 * The badge bubble itself — rendered and positioned by {@link LUIBadgeWrapper}
 * in typical usage. Shows a count (with `overflowCount` → `N+`), hides at zero
 * unless `showZero`, and pops when the count changes if `dynamic`.
 */
export function LUIBadge({
  count = null,
  color = '',
  size = 'md',
  overflowCount = 99,
  showZero = false,
  dynamic = false,
  onClicked,
}: LUIBadgeProps) {
  const [pop, setPop] = useState(false);
  const previous = useRef(count);

  useEffect(() => {
    if (dynamic && count !== previous.current) {
      // Retrigger the CSS animation: drop the class, re-add on the next frame.
      setPop(false);
      const id = requestAnimationFrame(() => setPop(true));
      previous.current = count;
      return () => cancelAnimationFrame(id);
    }
    previous.current = count;
  }, [count, dynamic]);

  const resolvedCount = count ?? 0;
  const visible = resolvedCount !== 0 || showZero;
  const display = resolvedCount > overflowCount ? `${overflowCount}+` : `${resolvedCount}`;

  const classes = [
    'l-badge',
    `l-badge--${size}`,
    !visible ? 'is-hidden' : '',
    pop ? 'is-pop' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={color ? ({ '--l-badge-color': color } as CSSProperties) : undefined}
      aria-hidden="true"
      onClick={(event) => {
        // Don't let a badge click also fire the underlying element's click.
        event.stopPropagation();
        onClicked?.(event);
      }}
      onAnimationEnd={() => setPop(false)}
    >
      {display}
    </span>
  );
}

export interface LUIBadgeWrapperProps extends ComponentPropsWithRef<'span'> {
  /** The count. Hidden at 0 unless `badgeShowZero` is set. */
  badge?: number | null;
  /** Any CSS color or token; defaults to the badge red shade. */
  badgeColor?: string;
  badgeSize?: BadgeSize;
  /** Show `N+` once the count passes this. Default 99. */
  badgeOverflowCount?: number;
  badgeShowZero?: boolean;
  /** Animate (pop) whenever the count changes. */
  badgeDynamic?: boolean;
  /** Fires when the badge bubble is clicked (does not trigger the host's click). */
  onBadgeClick?: (event: ReactMouseEvent<HTMLSpanElement>) => void;
}

/**
 * Attaches a count badge to its children — wrap a button, icon, avatar, or any
 * element and the bubble is positioned at its top-right corner. This is the
 * React counterpart of the Angular `[lBadge]` directive: the inputs are
 * mirrored with the `badge` prefix (`lBadgeColor` → `badgeColor`, …).
 *
 * ```tsx
 * <LUIBadgeWrapper badge={unread} badgeColor="var(--accent)" badgeDynamic>
 *   <button>🔔</button>
 * </LUIBadgeWrapper>
 * ```
 */
export function LUIBadgeWrapper({
  badge = null,
  badgeColor = '',
  badgeSize = 'md',
  badgeOverflowCount = 99,
  badgeShowZero = false,
  badgeDynamic = false,
  onBadgeClick,
  className,
  children,
  ...rest
}: LUIBadgeWrapperProps) {
  return (
    <span className={['l-badge-host', className ?? ''].filter(Boolean).join(' ')} {...rest}>
      {children}
      <LUIBadge
        count={badge}
        color={badgeColor}
        size={badgeSize}
        overflowCount={badgeOverflowCount}
        showZero={badgeShowZero}
        dynamic={badgeDynamic}
        onClicked={onBadgeClick}
      />
    </span>
  );
}
