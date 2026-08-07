import type { ComponentPropsWithRef, CSSProperties } from 'react';

/** Preset (`xs` 4px, `sm` 8px, `md` 16px, `lg` 24px, `xl` 32px), a pixel number, or any CSS size. */
export type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;

const SIZE_PRESETS: Record<string, string> = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

const toCssSize = (size: SpacerSize | undefined): string | undefined => {
  if (size === undefined) return undefined;
  if (typeof size === 'number') return `${size}px`;
  return SIZE_PRESETS[size] ?? size;
};

export interface LUISpacerProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Vertical space — sets the height. */
  h?: SpacerSize;
  /** Horizontal space — sets the width. */
  w?: SpacerSize;
}

/**
 * Empty block that adds fixed space between elements — inspired by Mantine's
 * `Space`. Use `h` for vertical gaps in a stack and `w` for horizontal gaps in
 * a row; it never shrinks, so the space holds inside flex layouts.
 *
 * ```tsx
 * <p>First</p>
 * <LUISpacer h="md" />
 * <p>Second</p>
 *
 * <LUIFlex align="center">
 *   <LUIButton>Save</LUIButton>
 *   <LUISpacer w={24} />
 *   <LUIButton>Cancel</LUIButton>
 * </LUIFlex>
 * ```
 */
export function LUISpacer({ h, w, style, ...rest }: LUISpacerProps) {
  const spacerStyle: CSSProperties = {
    height: toCssSize(h),
    width: toCssSize(w),
    flexShrink: 0,
    ...style,
  };

  return <div style={spacerStyle} aria-hidden="true" {...rest} />;
}
