/**
 * Edge the drawer is anchored to. The position alone determines the
 * enter/leave animation:
 *   left   → slides in to the right  (closes by sliding left)
 *   right  → slides in to the left   (closes by sliding right)
 *   bottom → slides up               (closes by sliding down)
 */
export type DrawerPosition = 'left' | 'right' | 'bottom';

export interface DrawerConfig<D = unknown> {
  /**
   * Arbitrary data for the content. Render-function content receives the
   * `DrawerRef` (read it back via `ref.config.data`); plain JSX content can
   * simply close over its data.
   */
  data?: D;

  /** Edge the panel docks to. Default: 'right'. */
  position?: DrawerPosition;

  /**
   * Size of the panel along its sliding axis — the width for left/right
   * drawers, the height for bottom drawers. E.g. '420px', '30vw', '50vh'.
   */
  size?: string;

  /** Extra class(es) applied to the panel element. */
  panelClass?: string | string[];

  /** Render the dimmed backdrop behind the panel. Default: true. */
  backdrop?: boolean;

  /** Prevent closing on backdrop click / Escape key. Default: false. */
  disableClose?: boolean;

  /** Animation duration in milliseconds. Default: 280. */
  animationDuration?: number;
}

export const DRAWER_DEFAULTS: Required<Omit<DrawerConfig, 'data' | 'size' | 'panelClass'>> = {
  position: 'right',
  backdrop: true,
  disableClose: false,
  animationDuration: 280,
};
