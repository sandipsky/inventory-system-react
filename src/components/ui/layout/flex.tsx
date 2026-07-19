import type { ComponentPropsWithRef, CSSProperties } from 'react';

export type FlexJustify =
  | 'normal'
  | 'start'
  | 'end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
export type FlexAlign = 'normal' | 'start' | 'end' | 'center' | 'stretch' | 'baseline';
export type FlexWrap = boolean | 'nowrap' | 'wrap' | 'wrap-reverse';
/** Preset (`small` 8px, `middle` 16px, `large` 24px), a pixel number, or any CSS gap value. */
export type FlexGap = 'small' | 'middle' | 'large' | number | string;

const GAP_PRESETS: Record<string, string> = { small: '8px', middle: '16px', large: '24px' };

export interface LUIFlexProps extends ComponentPropsWithRef<'div'> {
  /** Lay children out as a column instead of a row. */
  vertical?: boolean;
  justify?: FlexJustify;
  align?: FlexAlign;
  /** `true`/`false`, or any CSS `flex-wrap` keyword. */
  wrap?: FlexWrap;
  gap?: FlexGap;
}

/**
 * Flexbox container inspired by Ant Design's `Flex`. A thin, style-only wrapper —
 * all layout is applied to the root element, so children flow exactly as written.
 *
 * ```tsx
 * <LUIFlex gap="middle" justify="space-between" align="center">…</LUIFlex>
 * <LUIFlex vertical gap="small">…</LUIFlex>
 * ```
 */
export function LUIFlex({
  vertical = false,
  justify = 'normal',
  align = 'normal',
  wrap = false,
  gap = 0,
  style,
  children,
  ...rest
}: LUIFlexProps) {
  const wrapStyle = typeof wrap === 'boolean' ? (wrap ? 'wrap' : 'nowrap') : wrap;

  const gapStyle =
    typeof gap === 'number' ? (gap ? `${gap}px` : undefined) : (GAP_PRESETS[gap] ?? gap);

  const flexStyle: CSSProperties = {
    display: 'flex',
    flexDirection: vertical ? 'column' : 'row',
    flexWrap: wrapStyle,
    justifyContent: toCssAlignment(justify),
    alignItems: toCssAlignment(align),
    gap: gapStyle,
    ...style,
  };

  return (
    <div style={flexStyle} {...rest}>
      {children}
    </div>
  );
}

/** `start`/`end` need the `flex-` prefix for widest browser support; `normal` means "unset". */
function toCssAlignment(value: string): string | undefined {
  if (value === 'normal') return undefined;
  return value === 'start' || value === 'end' ? `flex-${value}` : value;
}
