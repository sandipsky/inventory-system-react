/**
 * Pure-CSS entry/leave animations supported by the modal.
 * Each value maps to a `.modal-anim-<name>` class with matching
 * `@keyframes` defined in the modal container styles.
 */
export type ModalAnimation =
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'fade'
  | 'zoom'
  | 'none';

export interface ModalConfig<D = unknown> {
  /**
   * Arbitrary data for the content. Render-function content receives the
   * `ModalRef` (read it back via `ref.config.data`); plain JSX content can
   * simply close over its data.
   */
  data?: D;

  /** Panel width, e.g. '40vw', '500px'. */
  width?: string;
  /** Panel height. */
  height?: string;
  /** Panel max width (defaults to 90vw). */
  maxWidth?: string;

  /** Extra class(es) applied to the panel element. */
  panelClass?: string | string[];

  /** Render the dimmed backdrop behind the panel. Default: true. */
  backdrop?: boolean;

  /** Prevent closing on backdrop click / Escape key. Default: false. */
  disableClose?: boolean;

  /** Entry/leave animation. Default: 'slideUp'. */
  animation?: ModalAnimation;

  /** Animation duration in milliseconds. Default: 250. */
  animationDuration?: number;
}

export const MODAL_DEFAULTS: Required<
  Omit<ModalConfig, 'data' | 'width' | 'height' | 'panelClass'>
> = {
  maxWidth: '90vw',
  backdrop: true,
  disableClose: false,
  animation: 'slideUp',
  animationDuration: 250,
};
