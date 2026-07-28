import type { ComponentPropsWithRef, ReactNode } from 'react';
import './card.css';

export type CardVariant = 'default' | 'dark';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardShadow = 'none' | 'sm' | 'md' | 'lg';

export interface LUICardProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Surface tint — `dark` uses the darker section background. */
  variant?: CardVariant;

  /** Inner padding of each region: `none` 0, `sm` 8, `md` 12, `lg` 20 (px). */
  padding?: CardPadding;

  /** Drop-shadow strength. */
  shadow?: CardShadow;

  /** Show the 1px border around the card. */
  bordered?: boolean;

  /** Lift the card and add a shadow on hover — for clickable cards. */
  hoverable?: boolean;

  /** Header title, rendered on the left. Adding it (or `extra`) shows the header. */
  title?: ReactNode;

  /** Header content rendered on the right (actions, links). */
  extra?: ReactNode;

  /** Footer content, separated from the body by a divider. */
  footer?: ReactNode;
}

export function LUICard({
  variant = 'default',
  padding = 'md',
  shadow = 'none',
  bordered = true,
  hoverable = false,
  title,
  extra,
  footer,
  className,
  children,
  ...rest
}: LUICardProps) {
  const hasHeader = title != null || extra != null;

  const classes = [
    'lui-card',
    variant === 'dark' ? 'lui-card-dark' : '',
    `lui-card-pad-${padding}`,
    shadow !== 'none' ? `lui-card-shadow-${shadow}` : '',
    bordered ? '' : 'lui-card-borderless',
    hoverable ? 'lui-card-hoverable' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {hasHeader && (
        <div className="lui-card__header">
          {title != null && <div className="lui-card__title">{title}</div>}
          {extra != null && <div className="lui-card__extra">{extra}</div>}
        </div>
      )}
      <div className="lui-card__body">{children}</div>
      {footer != null && <div className="lui-card__footer">{footer}</div>}
    </div>
  );
}
