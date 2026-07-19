import type { ReactNode } from 'react';
import './skeleton.css';

export interface LUISkeletonProps {
  /** Width as any CSS length, e.g. '100%', '240px'. Ignored when `circle` is set. */
  width?: string;
  /** Height as any CSS length. Required for standalone blocks and for `circle`. */
  height?: string;
  /** Corner radius (any CSS length). Overridden to a full circle when `circle` is set. */
  radius?: string;
  /** Render a circle: width follows `height` and the radius becomes 50%. */
  circle?: boolean;
  /** Play the pulsing animation. Default: true. */
  animate?: boolean;
  /** Show the skeleton overlay (true) or reveal the wrapped content (false). */
  visible?: boolean;
  children?: ReactNode;
}

/**
 * Placeholder shown while content loads — inspired by Mantine's `Skeleton`.
 *
 * Use it standalone as a sized block (`height`/`width`/`radius`, or `circle`)
 * or wrap real content and toggle `visible`: while `visible` is true an opaque,
 * pulsing overlay covers the children; once false the content shows.
 *
 * ```tsx
 * <LUISkeleton height="1rem" width="60%" />
 * <LUISkeleton circle height="48px" />
 *
 * <LUISkeleton visible={loading}>
 *   <p>Real content, revealed when loading finishes.</p>
 * </LUISkeleton>
 * ```
 */
export function LUISkeleton({
  width = '100%',
  height,
  radius = '8px',
  circle = false,
  animate = true,
  visible = true,
  children,
}: LUISkeletonProps) {
  return (
    <div
      className="l-skeleton"
      data-visible={visible ? '' : undefined}
      data-animate={visible && animate ? '' : undefined}
      aria-hidden={visible ? true : undefined}
      style={{
        width: circle ? height : width,
        height,
        borderRadius: circle ? '50%' : radius,
      }}
    >
      {children}
    </div>
  );
}
