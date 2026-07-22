import type { ComponentPropsWithRef } from 'react';
import './chip.css';

export type ChipVariant = 'default' | 'primary' | 'success' | 'error' | 'warn' | 'info' | 'premium';
export type ChipSize = 'sm' | 'md' | 'lg';

export interface LUIChipProps extends ComponentPropsWithRef<'span'> {
  variant?: ChipVariant;
  size?: ChipSize;
  /** Show a leading dot in the variant color. */
  dot?: boolean;
  /** Show a remove button; pressing it fires `onRemoved`. */
  removable?: boolean;
  /** Accessible label for the remove button. */
  removeLabel?: string;
  /** Fires when the remove button is pressed. The consumer removes the chip. */
  onRemoved?: () => void;
}

/**
 * Pill-shaped label for statuses, tags and filters. Tinted per `variant`, with
 * an optional leading status `dot` and an optional remove button (`removable`
 * + `onRemoved`) for dismissible tags.
 *
 * ```tsx
 * <LUIChip variant="success" dot>Active</LUIChip>
 * <LUIChip removable onRemoved={onRemove}>React</LUIChip>
 * ```
 */
export function LUIChip({
  variant = 'default',
  size = 'md',
  dot = false,
  removable = false,
  removeLabel = 'Remove',
  onRemoved,
  className,
  children,
  ...rest
}: LUIChipProps) {
  const classes = ['l-chip', `l-chip--${variant}`, `l-chip--${size}`, className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {dot && <span className="l-chip__dot" aria-hidden="true" />}
      {children}
      {removable && (
        <button
          type="button"
          className="l-chip__remove"
          aria-label={removeLabel}
          onClick={() => onRemoved?.()}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      )}
    </span>
  );
}
