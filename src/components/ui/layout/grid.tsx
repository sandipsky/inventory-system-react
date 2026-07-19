import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
} from 'react';

export type GridBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/** Per-breakpoint column settings; a bare number is shorthand for `{ span }`. */
export interface ColSize {
  span?: number;
  offset?: number;
  order?: number;
}
export type ColResponsive = number | ColSize;

export type RowJustify =
  | 'start'
  | 'end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
export type RowAlign = 'top' | 'middle' | 'bottom' | 'stretch';

const COLUMNS = 24;

/** Ant Design's responsive breakpoints (min-widths, px). */
const BREAKPOINT_MIN_WIDTH: Record<GridBreakpoint, number> = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};
const BREAKPOINT_ORDER: GridBreakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

const ROW_ALIGN_MAP: Record<RowAlign, string> = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end',
  stretch: 'stretch',
};

/**
 * Tracks the viewport width so `LUICol` responsive props re-evaluate on resize.
 * Returns the active breakpoints, smallest first — later entries override
 * earlier ones (mobile-first).
 */
function useActiveBreakpoints(): GridBreakpoint[] {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return BREAKPOINT_ORDER.filter((bp) => width >= BREAKPOINT_MIN_WIDTH[bp]);
}

/** Horizontal gutter handed from `LUIRow` to its `LUICol` children. */
const RowGutterContext = createContext(0);

export interface LUIRowProps extends ComponentPropsWithRef<'div'> {
  /** Spacing between columns (px). A `[horizontal, vertical]` pair also spaces wrapped lines. */
  gutter?: number | [number, number];
  justify?: RowJustify;
  align?: RowAlign;
  wrap?: boolean;
}

/**
 * 24-column grid row inspired by Ant Design's `Row`. Hosts `LUICol` children and
 * hands them the horizontal `gutter` (cols pad themselves; the row cancels the
 * outer padding with negative margins). A `[h, v]` gutter adds vertical space
 * between wrapped lines via `row-gap`.
 *
 * ```tsx
 * <LUIRow gutter={[16, 16]} justify="center" align="middle">
 *   <LUICol span={12} md={8}>…</LUICol>
 * </LUIRow>
 * ```
 */
export function LUIRow({
  gutter = 0,
  justify = 'start',
  align = 'top',
  wrap = true,
  style,
  children,
  ...rest
}: LUIRowProps) {
  /** Horizontal gutter — read by child `LUICol`s to pad themselves. */
  const gutterX = Array.isArray(gutter) ? gutter[0] : gutter;
  const gutterY = Array.isArray(gutter) ? gutter[1] : 0;

  const gutterMargin = gutterX ? -gutterX / 2 : undefined;

  const rowStyle: CSSProperties = {
    display: 'flex',
    flexWrap: wrap ? 'wrap' : 'nowrap',
    justifyContent: justify === 'start' || justify === 'end' ? `flex-${justify}` : justify,
    alignItems: ROW_ALIGN_MAP[align],
    marginLeft: gutterMargin,
    marginRight: gutterMargin,
    rowGap: gutterY || undefined,
    ...style,
  };

  return (
    <RowGutterContext.Provider value={gutterX}>
      <div style={rowStyle} {...rest}>
        {children}
      </div>
    </RowGutterContext.Provider>
  );
}

export interface LUIColProps extends ComponentPropsWithRef<'div'> {
  /** Columns to span out of 24. `0` hides the column. Unset → sized by content (or `flex`). */
  span?: number | null;
  /** Columns to skip on the left, out of 24. */
  offset?: number;
  order?: number | null;
  /** CSS `flex` shorthand — `'auto'` (fill), a grow number, or e.g. `'0 0 200px'`. */
  flex?: string | number | null;

  xs?: ColResponsive | null;
  sm?: ColResponsive | null;
  md?: ColResponsive | null;
  lg?: ColResponsive | null;
  xl?: ColResponsive | null;
  xxl?: ColResponsive | null;
}

/**
 * Grid column for `LUIRow`, on a 24-column track. `span`/`offset`/`order` are the
 * base values; the `xs`…`xxl` props override them per breakpoint, mobile-first
 * (the largest matching breakpoint wins). `span: 0` hides the column. `flex`
 * takes precedence over `span` for fill/fixed-width columns.
 */
export function LUICol({
  span = null,
  offset = 0,
  order = null,
  flex = null,
  xs = null,
  sm = null,
  md = null,
  lg = null,
  xl = null,
  xxl = null,
  style,
  children,
  ...rest
}: LUIColProps) {
  const gutterX = useContext(RowGutterContext);
  const activeBreakpoints = useActiveBreakpoints();

  const byBreakpoint: Record<GridBreakpoint, ColResponsive | null> = {
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
  };

  /** Base size merged with every active breakpoint override, smallest first. */
  const size: ColSize = {
    span: span ?? undefined,
    offset,
    order: order ?? undefined,
  };
  for (const bp of activeBreakpoints) {
    const value = byBreakpoint[bp];
    if (value == null) continue;
    if (typeof value === 'number') size.span = value;
    else Object.assign(size, value);
  }

  const hidden = size.span === 0;

  let flexStyle: string | undefined;
  if (flex !== null && flex !== '') {
    if (typeof flex === 'number') flexStyle = `${flex} ${flex} auto`;
    else if (flex === 'auto') flexStyle = '1 1 auto';
    else if (flex === 'none') flexStyle = 'none';
    /* A bare length ('200px', '25%') means a fixed basis; anything else is passed through. */
    else flexStyle = /^\d+(\.\d+)?(px|%|em|rem|vw|vh)$/.test(flex) ? `0 0 ${flex}` : flex;
  } else {
    flexStyle = size.span != null ? `0 0 ${percent(size.span)}` : undefined;
  }

  const maxWidth = flex === null && size.span != null ? percent(size.span) : undefined;
  const gutterPad = gutterX ? gutterX / 2 : undefined;

  const colStyle: CSSProperties = {
    display: hidden ? 'none' : 'block',
    boxSizing: 'border-box',
    minWidth: 0,
    flex: flexStyle,
    maxWidth,
    marginLeft: size.offset ? percent(size.offset) : undefined,
    order: size.order,
    paddingLeft: gutterPad,
    paddingRight: gutterPad,
    ...style,
  };

  return (
    <div style={colStyle} {...rest}>
      {children}
    </div>
  );
}

function percent(span: number): string {
  return `${(span / COLUMNS) * 100}%`;
}
