import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import './menu.css';

export type MenuMode = 'left' | 'right';

/** Imperative surface reachable through the `ref` prop. */
export interface LUIMenuRef {
  /** Close the panel if it is open. */
  close: () => void;
  /** Open when closed, close when open. */
  toggle: () => void;
  /** Whether the panel is currently open. */
  isOpen: boolean;
}

/** Below this much room beneath the trigger, the panel flips above it. */
const MIN_SPACE_BELOW = 180;

interface MenuPosition {
  dropUp: boolean;
  top: number | null;
  bottom: number | null;
  left: number | null;
  right: number | null;
  maxHeight: number | null;
}

export interface LUIMenuProps {
  /** Which trigger edge the panel aligns to. */
  mode?: MenuMode;
  /** Close the panel when the panel content is clicked. */
  closeOnItemClick?: boolean;
  /** Drop the panel's inner padding (for custom, edge-to-edge content). */
  contentMode?: boolean;
  /** Highlight the trigger while the panel is open. */
  showActiveState?: boolean;
  /** The trigger element (Angular's `[dropdown-display]` slot). */
  dropdownDisplay?: ReactNode;
  /**
   * The panel contents (Angular's `[dropdown-item]` / `[dropdown-content]`
   * slots). Give clickable rows the `dropdown-item` class (plus `active` to
   * mark the current choice).
   */
  children?: ReactNode;
  /** Imperative handle exposing `toggle()` / `close()` / `isOpen`. */
  ref?: Ref<LUIMenuRef>;
}

/**
 * Lightweight dropdown/popover. Pass the trigger via `dropdownDisplay` and the
 * panel contents as `children`:
 *
 * ```tsx
 * <LUIMenu mode="right" dropdownDisplay={<button>Open</button>}>
 *   <div className="dropdown-item" onClick={…}>Action</div>
 * </LUIMenu>
 * ```
 *
 * The panel renders in a fixed layer anchored to the trigger, so it escapes any
 * `overflow` clipping on ancestors, flips above the trigger when there isn't
 * room below, and stays anchored while the page scrolls — mirroring the
 * `LUISelect` dropdown behavior. It closes on any click outside the component.
 */
export function LUIMenu({
  mode = 'left',
  closeOnItemClick = true,
  contentMode = false,
  showActiveState = true,
  dropdownDisplay,
  children,
  ref,
}: LUIMenuProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  /* Reveal only after the position is applied so it never flashes at the wrong spot. */
  const [isReady, setIsReady] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({
    dropUp: false,
    top: null,
    bottom: null,
    left: null,
    right: null,
    maxHeight: null,
  });

  /**
   * Anchor the fixed panel to the trigger rect: align the requested edge
   * horizontally, drop below by default, flip above when room runs out, and cap
   * the height to the space available.
   */
  const reposition = (): void => {
    const host = hostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const gap = 6;
    const viewportHeight = window.innerHeight;
    // `clientWidth` excludes the vertical scrollbar; a fixed element's `right`
    // offset is measured from that same edge, so using `innerWidth` (which
    // includes the scrollbar) would shift a right-anchored panel left by the
    // scrollbar width and break the alignment.
    const viewportWidth = document.documentElement.clientWidth;
    const spaceBelow = viewportHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const dropUp = spaceBelow < MIN_SPACE_BELOW && spaceAbove > spaceBelow;

    setPosition({
      dropUp,
      maxHeight: Math.max(120, (dropUp ? spaceAbove : spaceBelow) - 8),
      left: mode === 'right' ? null : rect.left,
      right: mode === 'right' ? viewportWidth - rect.right : null,
      top: dropUp ? null : rect.bottom + gap,
      bottom: dropUp ? viewportHeight - rect.top + gap : null,
    });
  };

  const close = (): void => {
    setOpen(false);
    setIsReady(false);
  };

  const toggle = (): void => {
    if (open) {
      close();
    } else {
      reposition();
      setOpen(true);
    }
  };

  useImperativeHandle(ref, () => ({ toggle, close, isOpen: open }));

  useEffect(() => {
    if (!open) return;

    const onViewportChange = (): void => reposition();
    const onDocumentClick = (event: globalThis.MouseEvent): void => {
      if (hostRef.current && !hostRef.current.contains(event.target as Node)) close();
    };

    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    document.addEventListener('click', onDocumentClick);
    const raf = requestAnimationFrame(() => setIsReady(true));

    return () => {
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
      document.removeEventListener('click', onDocumentClick);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div
      ref={hostRef}
      className={['dropdown-menu', open && showActiveState ? 'active' : ''].filter(Boolean).join(' ')}
      onClick={toggle}
    >
      {dropdownDisplay}

      {open && (
        <div
          className={[
            'dropdown-content',
            isReady ? 'visible' : '',
            position.dropUp ? 'is-up' : '',
            contentMode ? 'nopadding' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            top: position.top ?? undefined,
            bottom: position.bottom ?? undefined,
            left: position.left ?? undefined,
            right: position.right ?? undefined,
            maxHeight: position.maxHeight ?? undefined,
          }}
          onClick={(event) => {
            if (!closeOnItemClick) event.stopPropagation();
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
