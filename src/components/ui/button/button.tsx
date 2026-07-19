import type { ComponentPropsWithRef } from 'react';
import './button.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outlined'
  | 'outlined-primary'
  | 'danger'
  | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonWidth = 'auto' | 'full';

export interface LUIButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;

  /** `sm` 4×8, `md` 6×12, `lg` 8×16 (px). */
  size?: ButtonSize;

  /** `auto` fits content, `full` fills the parent width. */
  width?: ButtonWidth;

  /** Render as a circular icon button. */
  rounded?: boolean;
}

export function LUIButton({
  variant = 'primary',
  size = 'md',
  width = 'auto',
  rounded = false,
  className,
  type = 'button',
  children,
  ...rest
}: LUIButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    width === 'full' ? 'full' : '',
    rounded ? 'rounded' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
