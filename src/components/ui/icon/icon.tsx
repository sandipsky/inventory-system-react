import type { ComponentPropsWithRef } from 'react';
import './icon.css';

/**
 * Icon names — the file names (minus `.svg`) under `src/assets/svg/`.
 * `(string & {})` keeps the union open so newly dropped-in files work
 * without touching this type, while existing names still autocomplete.
 */
export type LUIIconName =
  | 'account'
  | 'accounting'
  | 'add'
  | 'auto-code-generator'
  | 'backup-restore'
  | 'bde'
  | 'bulk-order'
  | 'calculator'
  | 'calendar'
  | 'cancel'
  | 'caret'
  | 'caret-down'
  | 'cash-bank-voucher'
  | 'category'
  | 'close'
  | 'closing'
  | 'configuration'
  | 'credit-note'
  | 'cross'
  | 'customer'
  | 'dashboard'
  | 'debit-note'
  | 'designation'
  | 'dispatch'
  | 'document-numbering-scheme'
  | 'download'
  | 'edit'
  | 'eye'
  | 'eye-login'
  | 'eye-slash'
  | 'filter'
  | 'finish-goods-receipt'
  | 'hold'
  | 'inventory'
  | 'journal-entry'
  | 'lock'
  | 'logout'
  | 'manufacturing'
  | 'master'
  | 'material-issue'
  | 'material-issue-return'
  | 'more'
  | 'notification'
  | 'notify'
  | 'opening-balance'
  | 'opening-stock'
  | 'packing'
  | 'payment'
  | 'payment-adjustment'
  | 'pending'
  | 'physical-stock-master'
  | 'print'
  | 'printer'
  | 'products'
  | 'purchase'
  | 'purchase-action'
  | 'purchase-entry'
  | 'purchase-order'
  | 'purchase-return'
  | 'reports'
  | 'roles-permission'
  | 'sales'
  | 'sales-entry'
  | 'sales-order'
  | 'sales-return'
  | 'search'
  | 'settings'
  | 'sidebar'
  | 'sms'
  | 'stock-adjustment'
  | 'stock-edit'
  | 'taxtype'
  | 'trash'
  | 'unit'
  | 'user'
  | 'user-plus'
  | 'users'
  | 'vendor'
  | (string & {});

const RAW_ICONS = import.meta.glob('../../../assets/svg/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * The source files hardcode their gray (`stroke="#646663"`, `fill="#555755"`,
 * …) and their 20px width/height. Swap the colors for `currentColor` so the
 * `color` prop (or the inherited text color) drives them, and drop the fixed
 * dimensions so the host span's size wins.
 */
const normalize = (raw: string): string =>
  raw
    .replace(/<svg([^>]*)>/, (_, attrs: string) => `<svg${attrs.replace(/\s(?:width|height)="[^"]*"/g, '')}>`)
    .replace(/\b(stroke|fill)="(?!none)[^"]*"/g, '$1="currentColor"');

const ICONS = new Map<string, string>();
for (const [path, raw] of Object.entries(RAW_ICONS)) {
  ICONS.set(path.split('/').pop()!.replace(/\.svg$/, ''), normalize(raw));
}

/** Every available icon name, sorted — handy for galleries and pickers. */
export const LUI_ICON_NAMES: readonly LUIIconName[] = [...ICONS.keys()].sort();

export interface LUIIconProps extends ComponentPropsWithRef<'span'> {
  /** Icon to draw — an svg file name from `src/assets/svg/` without the extension. */
  name: LUIIconName;
  /** Width/height. A number is pixels; any CSS size string works too. */
  size?: number | string;
  /**
   * Icon color — any CSS color, including `var(--…)` tokens. Defaults to
   * `var(--text-tertiary)` (#646663); pass `"inherit"` to follow the
   * surrounding text color instead.
   */
  color?: string;
}

/**
 * Inline SVG icon. Renders the named file from `src/assets/svg/` with its
 * colors rebound to `currentColor`, so it tints via the `color` prop —
 * defaulting to `var(--text-tertiary)` (#646663), the gray the icons were
 * drawn with.
 *
 * ```tsx
 * <LUIIcon name="user" />
 * <LUIIcon name="trash" size={16} color="var(--error)" />
 * ```
 */
export function LUIIcon({ name, size = 20, color, className, style, ...rest }: LUIIconProps) {
  const svg = ICONS.get(name);
  if (!svg) {
    if (import.meta.env.DEV) console.warn(`[LUIIcon] Unknown icon name "${name}".`);
    return null;
  }

  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <span
      className={['lui-icon', className ?? ''].filter(Boolean).join(' ')}
      style={{ width: dimension, height: dimension, color, ...style }}
      aria-hidden="true"
      {...rest}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
