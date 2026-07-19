import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import './tooltip.css';

/** The resolved side the bubble sits on relative to its trigger. */
export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

/** Ant-style placement names: a side plus optional start/end alignment. */
export type TooltipPlacement =
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight'
  | 'left'
  | 'leftTop'
  | 'leftBottom'
  | 'right'
  | 'rightTop'
  | 'rightBottom';

export type TooltipTrigger = 'hover' | 'focus' | 'click';

type Align = 'start' | 'center' | 'end';

const PLACEMENTS: Record<TooltipPlacement, { side: TooltipSide; align: Align }> = {
  top: { side: 'top', align: 'center' },
  topLeft: { side: 'top', align: 'start' },
  topRight: { side: 'top', align: 'end' },
  bottom: { side: 'bottom', align: 'center' },
  bottomLeft: { side: 'bottom', align: 'start' },
  bottomRight: { side: 'bottom', align: 'end' },
  left: { side: 'left', align: 'center' },
  leftTop: { side: 'left', align: 'start' },
  leftBottom: { side: 'left', align: 'end' },
  right: { side: 'right', align: 'center' },
  rightTop: { side: 'right', align: 'start' },
  rightBottom: { side: 'right', align: 'end' },
};

const _clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

export interface LUITooltipProps {
  /** The tooltip text. An empty string disables the tooltip. */
  content?: string;
  placement?: TooltipPlacement;
  trigger?: TooltipTrigger;
  /** Suppress the tooltip without removing the wrapper. */
  disabled?: boolean;
  /** Render the arrow pointing at the trigger. */
  arrow?: boolean;
  /** Any CSS color/token for the bubble background (e.g. `var(--error)`). */
  color?: string;
  /** Max bubble width in px before the text wraps; unset → style default (240px). */
  maxWidth?: number | null;
  /** Delay before showing, in ms. */
  openDelay?: number;
  /** Delay before hiding, in ms. */
  closeDelay?: number;
  /** The trigger — a single element the tooltip is anchored to. */
  children: ReactNode;
}

/**
 * Attaches an Ant-style tooltip to its child element. Shows on hover + keyboard
 * focus by default; switch with `trigger`. The bubble renders in a fixed layer
 * portalled into `<body>`, so it escapes any ancestor `overflow` clipping,
 * flips to the opposite side when it would overflow the viewport, and stays
 * anchored while the page scrolls.
 *
 * ```tsx
 * <LUITooltip content="Delete" placement="top"><button>🗑</button></LUITooltip>
 * <LUITooltip content="Copied to clipboard" trigger="click"><span>Copy</span></LUITooltip>
 * ```
 */
export function LUITooltip({
  content = '',
  placement = 'top',
  trigger = 'hover',
  disabled = false,
  arrow = true,
  color = '',
  maxWidth = null,
  openDelay = 120,
  closeDelay = 80,
  children,
}: LUITooltipProps) {
  const autoId = useId();
  const id = `l-tooltip-${autoId}`;

  /** The bubble has been created at least once (kept mounted for the fade-out). */
  const [mounted, setMounted] = useState(false);
  /** Logically open — drives positioning, viewport listeners and aria-describedby. */
  const [open, setOpen] = useState(false);
  /** Drives the `.is-visible` fade, set one frame after positioning. */
  const [shown, setShown] = useState(false);
  const [side, setSide] = useState<TooltipSide>(PLACEMENTS[placement].side);

  const wrapperRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabled = !disabled && content.trim().length > 0;

  const clearTimer = (which: 'open' | 'close'): void => {
    if (which === 'open' && openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (which === 'close' && closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const show = (): void => {
    if (!enabled) return;
    setMounted(true);
    setOpen(true);
  };

  const hide = (): void => {
    setOpen(false);
    setShown(false);
  };

  const scheduleShow = (): void => {
    clearTimer('close');
    if (open || !enabled) return;
    openTimer.current = setTimeout(show, openDelay);
  };

  const scheduleHide = (): void => {
    clearTimer('open');
    if (!open) return;
    closeTimer.current = setTimeout(hide, closeDelay);
  };

  /* Position the bubble beside the anchor whenever it is open, and keep it
     anchored on scroll/resize. Flips to the opposite side on viewport overflow. */
  useLayoutEffect(() => {
    if (!open) return;

    const position = (): void => {
      const el = bubbleRef.current;
      const anchor = wrapperRef.current?.firstElementChild as HTMLElement | null;
      if (!el || !anchor) return;

      const host = anchor.getBoundingClientRect();
      const tw = el.offsetWidth;
      const th = el.offsetHeight;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const gap = 8;
      const margin = 6;

      let { side: nextSide } = PLACEMENTS[placement];
      const { align } = PLACEMENTS[placement];

      // Flip to the opposite side when the preferred one would overflow.
      if (
        nextSide === 'top' &&
        host.top - th - gap < margin &&
        host.bottom + th + gap <= vh - margin
      ) {
        nextSide = 'bottom';
      } else if (
        nextSide === 'bottom' &&
        host.bottom + th + gap > vh - margin &&
        host.top - th - gap >= margin
      ) {
        nextSide = 'top';
      } else if (
        nextSide === 'left' &&
        host.left - tw - gap < margin &&
        host.right + tw + gap <= vw - margin
      ) {
        nextSide = 'right';
      } else if (
        nextSide === 'right' &&
        host.right + tw + gap > vw - margin &&
        host.left - tw - gap >= margin
      ) {
        nextSide = 'left';
      }

      const cx = host.left + host.width / 2;
      const cy = host.top + host.height / 2;
      let top: number;
      let left: number;
      let arrowPos: number;

      if (nextSide === 'top' || nextSide === 'bottom') {
        top = nextSide === 'top' ? host.top - th - gap : host.bottom + gap;
        left = align === 'start' ? host.left : align === 'end' ? host.right - tw : cx - tw / 2;
        left = _clamp(left, margin, vw - tw - margin);
        arrowPos = _clamp(cx - left, 12, tw - 12);
      } else {
        left = nextSide === 'left' ? host.left - tw - gap : host.right + gap;
        top = align === 'start' ? host.top : align === 'end' ? host.bottom - th : cy - th / 2;
        top = _clamp(top, margin, vh - th - margin);
        arrowPos = _clamp(cy - top, 12, th - 12);
      }

      setSide(nextSide);
      el.style.top = `${Math.round(top)}px`;
      el.style.left = `${Math.round(left)}px`;
      el.style.setProperty('--l-tooltip-arrow-pos', `${Math.round(arrowPos)}px`);
    };

    position();
    const raf = requestAnimationFrame(() => setShown(true));

    const onViewportChange = (): void => position();
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [open, placement, content, arrow, maxWidth]);

  /* Mirror Angular's `[attr.aria-describedby]` host binding on the anchor element. */
  useEffect(() => {
    const anchor = wrapperRef.current?.firstElementChild as HTMLElement | null;
    if (!anchor || !open) return;
    anchor.setAttribute('aria-describedby', id);
    return () => anchor.removeAttribute('aria-describedby');
  }, [open, id]);

  /* Clear pending timers on unmount. */
  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>): void => {
    if (event.key === 'Escape' && open) hide();
  };

  const bubbleClasses = ['l-tooltip', `l-tooltip--${side}`, shown ? 'is-visible' : '']
    .filter(Boolean)
    .join(' ');

  const bubbleStyle = {
    ...(color ? { '--l-tooltip-bg': color } : null),
    ...(maxWidth ? { '--l-tooltip-max-width': `${maxWidth}px` } : null),
  } as CSSProperties;

  return (
    <>
      <span
        ref={wrapperRef}
        style={{ display: 'contents' }}
        onMouseEnter={() => {
          if (trigger === 'hover') scheduleShow();
        }}
        onMouseLeave={() => {
          if (trigger === 'hover') scheduleHide();
        }}
        onFocus={() => {
          // Keyboard focus reveals the tooltip for hover and focus triggers alike.
          if (trigger !== 'click') scheduleShow();
        }}
        onBlur={() => {
          if (trigger !== 'click') scheduleHide();
        }}
        onClick={() => {
          if (trigger !== 'click') return;
          if (open) hide();
          else show();
        }}
        onKeyDown={handleKeyDown}
      >
        {children}
      </span>

      {mounted &&
        createPortal(
          <div ref={bubbleRef} id={id} role="tooltip" className={bubbleClasses} style={bubbleStyle}>
            {arrow && <span className="l-tooltip__arrow" aria-hidden="true" />}
            <span className="l-tooltip__inner">{content}</span>
          </div>,
          document.body,
        )}
    </>
  );
}
