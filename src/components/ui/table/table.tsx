import {
  Children,
  isValidElement,
  useState,
  type KeyboardEvent,
  type Key,
  type ReactElement,
  type ReactNode,
} from 'react';
import './table.css';

export type SortDirection = 'asc' | 'desc';
export type TableAlign = 'left' | 'center' | 'right';

export interface TableSort {
  key: string;
  direction: SortDirection;
}

export interface TableColumn {
  /** Property read from each row (also the sort key). */
  key: string;
  header: string;
  sortable?: boolean;
  align?: TableAlign;
  /** Any CSS width, e.g. `120px` or `20%`. */
  width?: string;
}

/** Context handed to a custom {@link LUITableCell} renderer. */
export interface TableCellContext<T = object> {
  /** The row object. */
  row: T;
  /** The cell value (`row[column.key]`). */
  value: unknown;
  column: TableColumn;
  /** The row index in the rendered (sorted) order. */
  index: number;
}

export interface LUITableCellProps<T = object> {
  /** The column `key` this renderer draws. Required. */
  column: string;
  /** Render prop receiving the row, cell value, column and index. */
  children: (context: TableCellContext<T>) => ReactNode;
}

/**
 * Declares the custom cell renderer for a column — the React port of the
 * Angular `<ng-template lTableCell="key">` directive. Place it as a child of
 * {@link LUITable}; it renders nothing by itself.
 *
 * ```tsx
 * <LUITable columns={cols} data={rows}>
 *   <LUITableCell column="status">
 *     {({ value }) => <span className={`status ${value}`}>…</span>}
 *   </LUITableCell>
 * </LUITable>
 * ```
 */
export function LUITableCell<T = object>(props: LUITableCellProps<T>): ReactNode {
  // Configuration-only: LUITable reads the props off its children.
  void props;
  return null;
}

export interface LUITableProps {
  columns?: readonly TableColumn[];
  data?: readonly object[];
  /** Let the server sort: cycle the header + emit only, never reorder locally. */
  serverSort?: boolean;
  /**
   * Active sort; `null` means unsorted. Pass it (with `onSortChange`) to
   * control the sort from outside — omit it and the table keeps its own state.
   */
  sort?: TableSort | null;
  /** Fires on every sort change; with `serverSort`, refetch here and pass the sorted `data` back. */
  onSortChange?: (sort: TableSort | null) => void;
  loading?: boolean;
  emptyText?: string;
  /** Row identity for tracking: a property name or a function. Defaults to index. */
  rowKey?: string | ((row: object) => unknown);
  /** Called with the clicked row. */
  onRowClick?: (row: object) => void;
  /** `LUITableCell` elements declaring custom cell renderers. */
  children?: ReactNode;
}

/**
 * Data table with column sorting, styled to match the app's `_table.scss`.
 * Feed it `columns` + `data`; cells render `row[column.key]` by default, or a
 * custom `<LUITableCell column="key">` render prop when provided.
 *
 * Sorting works two ways, chosen by `serverSort`:
 * - **local** (default) — clicking a sortable header sorts `data` in place.
 * - **server** (`serverSort`) — the table only cycles the header state and
 *   calls `onSortChange`; you refetch and pass the sorted `data` back.
 *
 * Either way `sort` can be controlled (`sort` + `onSortChange`), so you can
 * seed or read it. Header clicks cycle ascending → descending → unsorted.
 *
 * ```tsx
 * <LUITable columns={cols} data={rows} sort={sort} onSortChange={setSort} />
 * <LUITable columns={cols} data={rows} serverSort
 *           loading={loading} sort={sort} onSortChange={fetch} />
 * ```
 */
export function LUITable({
  columns = [],
  data = [],
  serverSort = false,
  sort: sortProp,
  onSortChange,
  loading = false,
  emptyText = 'No data to display',
  rowKey,
  onRowClick,
  children,
}: LUITableProps) {
  // `sort` mirrors the Angular two-way `model()`: controlled when the prop is
  // provided (`null` counts — it means "unsorted"), self-managed otherwise.
  const [internalSort, setInternalSort] = useState<TableSort | null>(null);
  const isControlled = sortProp !== undefined;
  const sort = isControlled ? sortProp : internalSort;

  const setSort = (next: TableSort | null): void => {
    if (!isControlled) setInternalSort(next);
    onSortChange?.(next);
  };

  // Collect the custom cell renderers declared as <LUITableCell> children.
  const cellMap = new Map<string, (context: TableCellContext) => ReactNode>();
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === LUITableCell) {
      const { column, children: render } = (child as ReactElement<LUITableCellProps>).props;
      cellMap.set(column, render);
    }
  });

  const value = (row: object | undefined, key: string): unknown =>
    (row as Record<string, unknown> | undefined)?.[key];

  const rows = (() => {
    if (serverSort || !sort) return data;
    const { key, direction } = sort;
    const factor = direction === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => compare(value(a, key), value(b, key)) * factor);
  })();

  const sortClass = (column: TableColumn): 'asc' | 'desc' | 'none' =>
    sort && sort.key === column.key ? sort.direction : 'none';

  const ariaSort = (column: TableColumn): 'ascending' | 'descending' | 'none' | undefined => {
    if (!column.sortable) return undefined;
    if (!sort || sort.key !== column.key) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  };

  const toggleSort = (column: TableColumn): void => {
    if (!column.sortable) return;
    let next: TableSort | null;
    if (!sort || sort.key !== column.key) {
      next = { key: column.key, direction: 'asc' };
    } else if (sort.direction === 'asc') {
      next = { key: column.key, direction: 'desc' };
    } else {
      next = null; // desc → unsorted
    }
    setSort(next);
  };

  const onHeaderKeydown = (event: KeyboardEvent<HTMLTableCellElement>, column: TableColumn): void => {
    if (!column.sortable) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleSort(column);
    }
  };

  const trackRow = (index: number, row: object): Key => {
    const key = rowKey;
    if (typeof key === 'function') return String(key(row));
    if (typeof key === 'string') return String(value(row, key));
    return index;
  };

  const headerClasses = (column: TableColumn): string =>
    [
      column.sortable ? 'sort-by' : '',
      column.sortable ? sortClass(column) : '',
      column.align === 'center' ? 'text-center' : '',
      column.align === 'right' ? 'text-end' : '',
    ]
      .filter(Boolean)
      .join(' ');

  const cellClasses = (column: TableColumn): string =>
    [column.align === 'center' ? 'text-center' : '', column.align === 'right' ? 'text-end' : '']
      .filter(Boolean)
      .join(' ');

  return (
    <div className="l-table-host">
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={headerClasses(col) || undefined}
                  style={col.width ? { width: col.width } : undefined}
                  tabIndex={col.sortable ? 0 : undefined}
                  aria-sort={ariaSort(col)}
                  onClick={() => toggleSort(col)}
                  onKeyDown={(event) => onHeaderKeydown(event, col)}
                >
                  <span className="th-label">{col.header}</span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr key={trackRow(i, row)} onClick={() => onRowClick?.(row)}>
                {columns.map((col) => {
                  const render = cellMap.get(col.key);
                  return (
                    <td key={col.key} className={cellClasses(col) || undefined}>
                      {render
                        ? render({ row, value: value(row, col.key), column: col, index: i })
                        : interpolate(value(row, col.key))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {loading ? (
          <div className="l-table__overlay">
            <span className="l-table__spinner" aria-hidden="true"></span>
            <span className="l-table__overlay-text">Loading…</span>
          </div>
        ) : (
          !rows.length && (
            <div className="no-data">
              <p>{emptyText}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/** Default cell rendering — mirrors Angular `{{ value }}` interpolation. */
function interpolate(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}
