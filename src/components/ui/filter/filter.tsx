import { useRef, useState, type KeyboardEvent } from 'react';
import { LUIMenu, type LUIMenuRef } from '../menu/menu';
import { LUIButton } from '../button/button';
import { LUISelect } from '../input/select/select';
import { LUITextInput } from '../input/text-input/text-input';
import './filter.css';

/** A single configurable filter field. */
export interface FilterColumn {
  /** Field label shown above the control and in the active-filter chip. */
  name: string;
  /** The field key reported back in {@link FilterChange.field}. */
  formcontrolName: string;
  type: 'text' | 'select';
  /** Initial value for the field control (field state lives inside the component). */
  value?: string | number | null;
  /** Options for `select` fields (id ↔ value, name ↔ label); may carry extra keys for `groupBy`. */
  data?: readonly ({ id: string | number; name: string } & Record<string, unknown>)[];
  /** Optional `select` grouping key (a property on each option). */
  groupBy?: string;
}

/** One entry of the emitted, applied filter set. */
export interface FilterChange {
  field: string;
  value: string;
  displayValue: string;
}

/** Internal representation of an applied filter (column or free-text search). */
interface ActiveFilter {
  filterName?: string;
  formcontrolName: string;
  displayValue: string;
  value: string | number | null | undefined;
  type?: 'search';
}

export interface LUIFilterProps {
  /** Fields rendered inside the filter dropdown. */
  filterColumns?: FilterColumn[];
  /** Field key for the free-text search box; empty hides the search box. */
  searchBy?: string;
  /** Called with the full set of applied filters whenever it changes. */
  onFilterChange?: (filters: FilterChange[]) => void;
}

/**
 * Toolbar that combines a free-text search box with a dropdown of configurable
 * field filters (text / single-select). Applied filters surface as removable
 * chips, and the whole set is emitted via `onFilterChange`.
 *
 * ```tsx
 * <LUIFilter
 *   searchBy="name"
 *   filterColumns={columns}
 *   onFilterChange={onFilters}
 * />
 * ```
 */
export function LUIFilter({ filterColumns = [], searchBy = '', onFilterChange }: LUIFilterProps) {
  const filterDropdown = useRef<LUIMenuRef>(null);

  // Draft field values, keyed by `formcontrolName` (the Angular version wrote
  // them back onto the FilterColumn objects; here they live in state, seeded
  // from each column's `value`).
  const [values, setValues] = useState<Record<string, string | number | null | undefined>>(() =>
    Object.fromEntries(filterColumns.map((c) => [c.formcontrolName, c.value ?? null])),
  );
  const [filterList, setFilterList] = useState<ActiveFilter[]>([]);
  const [searchText, setSearchText] = useState('');

  const emitFilterList = (list: ActiveFilter[]): void => {
    const mapped = list.map((f) => ({
      field: f.formcontrolName,
      value: f.value != null ? String(f.value) : '',
      displayValue: f.displayValue,
    }));
    onFilterChange?.(mapped);
  };

  const setValue = (formcontrolName: string, value: string | number | null): void => {
    setValues((prev) => ({ ...prev, [formcontrolName]: value }));
  };

  const applyFilter = (): void => {
    const applied: ActiveFilter[] = [];

    for (const filter of filterColumns) {
      const value = values[filter.formcontrolName];
      if (!value) continue;
      applied.push({
        filterName: filter.name,
        formcontrolName: filter.formcontrolName,
        displayValue:
          filter.type === 'select'
            ? // Loose match on purpose: option ids may be numbers while the bound value is a string.
              (filter.data?.find((item) => String(item.id) === String(value))?.name ?? '')
            : String(value),
        value,
      });
    }

    // Keep any active free-text search alongside the rebuilt column filters.
    const search = filterList.find((f) => f.type === 'search');
    const next = search ? [...applied, search] : applied;
    setFilterList(next);

    closeDropdown();
    emitFilterList(next);
  };

  const onSearch = (): void => {
    const text = searchText;
    const withoutSearch = filterList.filter((f) => f.type !== 'search');
    const next: ActiveFilter[] = text
      ? [
          ...withoutSearch,
          { formcontrolName: searchBy, displayValue: text, value: text, type: 'search' },
        ]
      : withoutSearch;
    setFilterList(next);
    emitFilterList(next);
  };

  const removeFilter = (filter: ActiveFilter): void => {
    const next = filterList.filter((item) => item !== filter);
    setFilterList(next);
    const column = filterColumns.find((c) => c.name === filter.filterName);
    if (column) setValue(column.formcontrolName, null);
    emitFilterList(next);
  };

  const removeAllFilter = (): void => {
    setFilterList([]);
    setValues(Object.fromEntries(filterColumns.map((c) => [c.formcontrolName, null])));
    setSearchText('');
    emitFilterList([]);
  };

  const closeDropdown = (): void => {
    filterDropdown.current?.close();
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') onSearch();
  };

  return (
    <div className="l-filter-host">
      <div className="filter-section">
        {searchBy !== '' && (
          <div className="input-wrapper">
            <svg
              className="left-icon"
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              className="form-control"
              type="text"
              placeholder="Search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyUp={onSearchKeyDown}
            />
          </div>
        )}

        <LUIMenu
          ref={filterDropdown}
          contentMode
          closeOnItemClick={false}
          showActiveState={false}
          dropdownDisplay={
            <LUIButton variant="outlined">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.5 5h13l-5 6v4l-3-1.5V11l-5-6Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              Filters
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5 7.5 10 12.5 15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </LUIButton>
          }
        >
          <div className="filter-dropdown">
            <div className="filter-header">
              <h1 className="filter-header-title">Filter</h1>
              <LUIButton variant="outlined" rounded onClick={closeDropdown} aria-label="Close filters">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5 5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </LUIButton>
            </div>

            <div className="filter-body">
              {filterColumns.map((filter, index) => (
                <div className="form-group" key={index}>
                  <label>{filter.name}</label>

                  {filter.type === 'text' && (
                    <LUITextInput
                      placeholder={filter.name}
                      value={String(values[filter.formcontrolName] ?? '')}
                      onChange={(event) => setValue(filter.formcontrolName, event.target.value)}
                      onKeyUp={(event) => {
                        if (event.key === 'Enter') applyFilter();
                      }}
                    />
                  )}
                  {filter.type === 'select' && (
                    <LUISelect
                      items={filter.data ?? []}
                      bindLabel="name"
                      bindValue="id"
                      groupBy={filter.groupBy}
                      placeholder="Select"
                      value={values[filter.formcontrolName] ?? null}
                      onChange={(value) =>
                        setValue(filter.formcontrolName, value as string | number | null)
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="filter-footer">
              <LUIButton variant="secondary" onClick={closeDropdown}>
                Cancel
              </LUIButton>
              <LUIButton variant="primary" onClick={applyFilter}>
                Apply
              </LUIButton>
            </div>
          </div>
        </LUIMenu>
      </div>

      {filterList.length > 0 && (
        <div className="filter-options">
          {filterList.map(
            (item) =>
              item.type !== 'search' && (
                <div className="filter-item" key={item.formcontrolName}>
                  <span>
                    {item.filterName}: {item.displayValue}
                  </span>
                  <button
                    className="filter-item__remove"
                    onClick={() => removeFilter(item)}
                    aria-label="Remove filter"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 5 5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ),
          )}

          <span className="reset-text" onClick={removeAllFilter}>
            Reset Filters
          </span>
        </div>
      )}
    </div>
  );
}
