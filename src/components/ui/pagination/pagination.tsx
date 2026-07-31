import { useState, type CSSProperties } from 'react';
import { LUIMenu } from '../menu/menu';
import './pagination.css';

/** Payload emitted whenever the page index or page size changes. */
export interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

export interface LUIPaginationProps {
  pageSizeOptions?: number[];
  /** Total number of items being paginated; drives the page count. */
  length?: number;
  /**
   * Items per page. Angular `model()` — leave undefined for internal state, or
   * pair with `onPageSizeChange` for controlled usage.
   */
  pageSize?: number;
  /**
   * Zero-based index of the current page. Angular `model()` — leave undefined
   * for internal state, or pair with `onPageIndexChange` for controlled usage.
   */
  pageIndex?: number;
  /** Fires when the page size changes (changing it resets to the first page). */
  onPageSizeChange?: (size: number) => void;
  /** Fires when the page index changes. */
  onPageIndexChange?: (index: number) => void;
  /** Fires whenever the page index or page size changes. */
  onPageChange?: (event: PageEvent) => void;
}

const NEXT_ICON_PATH =
  'M14.83,11.29,10.59,7.05a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41L12.71,12,9.17,15.54a1,1,0,0,0,0,1.41,1,1,0,0,0,.71.29,1,1,0,0,0,.71-.29l4.24-4.24A1,1,0,0,0,14.83,11.29Z';
const LAST_ICON_PATH =
  'M8.46,8.29A1,1,0,1,0,7,9.71L9.34,12,7,14.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0l3-3a1,1,0,0,0,0-1.42Zm8.5,3-3-3a1,1,0,0,0-1.42,1.42L14.84,12l-2.3,2.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0l3-3A1,1,0,0,0,17,11.29Z';

/**
 * Page navigation with first/prev/next/last controls, a windowed page-number
 * strip, and a page-size dropdown (built on {@link LUIMenu}).
 *
 * ```tsx
 * <LUIPagination length={totalRows} onPageChange={(e) => load(e)} />
 * ```
 */
export function LUIPagination({
  pageSizeOptions = [10, 25, 50, 100],
  length = 0,
  pageSize: pageSizeProp,
  pageIndex: pageIndexProp,
  onPageSizeChange,
  onPageIndexChange,
  onPageChange,
}: LUIPaginationProps) {
  const [internalPageSize, setInternalPageSize] = useState(10);
  const [internalPageIndex, setInternalPageIndex] = useState(0);

  const pageSize = pageSizeProp ?? internalPageSize;
  const pageIndex = pageIndexProp ?? internalPageIndex;

  const totalPages = length > 0 ? Math.ceil(length / pageSize) : 1;

  /** Digit count of the largest page number — sizes every page button to the widest one. */
  const pageNumChars = String(totalPages).length;

  /* A sliding window of up to five page numbers centered on the current page. */
  const current = pageIndex + 1;
  let start = Math.max(current - 2, 1);
  let end = start + 4;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(end - 4, 1);
  }
  const visiblePages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const itemsInView = length === 0 ? 0 : Math.min(pageSize, length - pageIndex * pageSize);

  const commit = (nextIndex: number, nextSize: number): void => {
    setInternalPageIndex(nextIndex);
    setInternalPageSize(nextSize);
    if (nextIndex !== pageIndex) onPageIndexChange?.(nextIndex);
    if (nextSize !== pageSize) onPageSizeChange?.(nextSize);
    onPageChange?.({ pageIndex: nextIndex, pageSize: nextSize, length });
  };

  const onChangePageOption = (size: number): void => commit(0, size);
  const onPrevAndNext = (direction: 'prev' | 'next'): void =>
    commit(direction === 'prev' ? pageIndex - 1 : pageIndex + 1, pageSize);
  const goFirstPage = (): void => commit(0, pageSize);
  const goLastPage = (): void => commit(totalPages - 1, pageSize);
  const goToPage = (index: number): void => commit(index, pageSize);

  return (
    <div className="paginator">
      <span className="page-text">
        <span className="page-text light">Showing </span>
        <span className="page-text bold">{itemsInView} </span>
        <span className="page-text light">Entries out of </span>
        {length}
      </span>

      <div
        className="arrow-buttons"
        style={{ '--page-num-chars': pageNumChars } as CSSProperties}
      >
        <div
          className={['paginator-btn', pageIndex === 0 ? 'disabled' : ''].filter(Boolean).join(' ')}
          onClick={() => pageIndex !== 0 && goFirstPage()}
        >
          <svg
            style={{ transform: 'rotate(180deg)' }}
            fill="currentColor"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path d={LAST_ICON_PATH} />
          </svg>
          First
        </div>

        <div
          className={['paginator-btn', pageIndex === 0 ? 'disabled' : ''].filter(Boolean).join(' ')}
          onClick={() => pageIndex !== 0 && onPrevAndNext('prev')}
        >
          <svg
            style={{ transform: 'rotate(180deg)' }}
            fill="currentColor"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path d={NEXT_ICON_PATH} />
          </svg>
          Prev
        </div>

        {visiblePages.map((page) => (
          <div
            key={page}
            className={['paginator-btn', 'page-num', page === pageIndex + 1 ? 'active' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => goToPage(page - 1)}
          >
            {page}
          </div>
        ))}

        <div
          className={['paginator-btn', pageIndex + 1 === totalPages ? 'disabled' : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => pageIndex + 1 !== totalPages && onPrevAndNext('next')}
        >
          Next
          <svg fill="currentColor" width="20" height="20" viewBox="0 0 24 24">
            <path d={NEXT_ICON_PATH} />
          </svg>
        </div>

        <div
          className={['paginator-btn', pageIndex + 1 === totalPages ? 'disabled' : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => pageIndex + 1 !== totalPages && goLastPage()}
        >
          Last
          <svg fill="currentColor" width="20" height="20" viewBox="0 0 24 24">
            <path d={LAST_ICON_PATH} />
          </svg>
        </div>
      </div>

      <div className="page-items">
        <span className="page-text">Row per page: </span>
        <LUIMenu
          mode="right"
          dropdownDisplay={
            <div className="paginator-btn paginator-dropdown-btn">
              {pageSize}
              <svg fill="currentColor" width="20" height="20" viewBox="0 0 24 24">
                <path d={NEXT_ICON_PATH} />
              </svg>
            </div>
          }
        >
          {pageSizeOptions.map((item) => (
            <div
              key={item}
              className={['dropdown-item', item === pageSize ? 'active' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChangePageOption(item)}
            >
              {item}
            </div>
          ))}
        </LUIMenu>
      </div>
    </div>
  );
}
