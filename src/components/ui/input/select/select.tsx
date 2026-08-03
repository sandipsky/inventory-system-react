import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type UIEvent,
} from 'react';
import { createPortal } from 'react-dom';
import '../form.css';
import './select.css';

/** A single option after normalization, carrying its flat position in the visible list. */
interface NormalizedOption {
  /** The value emitted through `onChange` when selected. */
  value: unknown;
  /** The text shown in the trigger and dropdown row. */
  label: string;
  disabled: boolean;
  /** Group key (only set when `groupBy` is configured). */
  group: unknown;
  /** Index into the flat, filtered list — drives keyboard navigation. */
  index: number;
}

/** Gap (px) between rendered tags — kept in sync with `.l-select__tags` gap. */
const TAG_GAP = 4;
/** Width (px) reserved for the "+N" overflow badge when measuring responsive tags. */
const TAG_BADGE_RESERVE = 46;

/** Fixed row height (px) the virtual scroller assumes for every option. */
const ROW_HEIGHT = 36;
/** Max dropdown viewport height (px) — roughly seven rows. */
const VIEWPORT_HEIGHT = 252;
/** Extra rows rendered above/below the viewport so fast scrolling stays smooth. */
const OVERSCAN = 4;

export interface LUISelectProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;

  /** Allow selecting more than one option. The value becomes an array and the trigger shows tags. */
  multiple?: boolean;
  /** Cap the number of options that can be selected (multi-select only). Unset → unlimited. */
  maxCount?: number;
  /**
   * How many tags to show before collapsing the rest into a "+N" badge (multi-select only).
   * `'responsive'` (default) fits as many tags as the trigger width allows; a number shows
   * exactly that many.
   */
  maxTagCount?: number | 'responsive';
  /** Show a clear (×) affix that empties the selection. */
  clearable?: boolean;

  /** Options to choose from — primitives (`string[]`/`number[]`) or objects. */
  items?: readonly unknown[];

  /** For object items: the property to use as the emitted value. Unset → the whole item. */
  bindValue?: string;
  /** For object items: the property to display. Unset → falls back to the value, then `String(item)`. */
  bindLabel?: string;
  /** For object items: a truthy property that disables that single option. */
  bindDisabled?: string;
  /** For object items: the property to group options by, rendered under sticky headers. */
  groupBy?: string;

  /** Show an in-dropdown search box that filters options by label. */
  searchable?: boolean;
  /** Show the chevron affix on the right. */
  showArrow?: boolean;
  /** Replace the option list with a spinner — useful while an async `onSearch` is in flight. */
  showLoading?: boolean;
  /** Render only the visible window of rows. Best for large, ungrouped lists. */
  virtualScroll?: boolean;

  /** Controlled selected value — an array of values when `multiple`. */
  value?: unknown;
  /** Called with the selected value whenever it changes — an array in multiple mode. */
  onChange?: (value: unknown) => void;
  /** Called with the search text on every keystroke — wire this to an API call for server-side search. */
  onSearch?: (text: string) => void;
  /** Called when focus leaves the component — wire to react-hook-form Controller's `field.onBlur`. */
  onBlur?: () => void;

  className?: string;
}

/**
 * Single-select dropdown inspired by Ant Design. Accepts a plain array of
 * primitives or an array of objects (mapped via `bindValue`/`bindLabel`),
 * supports optional in-place search, grouping, a loading state for async
 * search, and a windowed virtual scroller for large datasets.
 *
 * A controlled component: pass `value` and `onChange(value)`. With
 * react-hook-form, wrap it in a `<Controller>`.
 */
export function LUISelect({
  label = '',
  placeholder = 'Select…',
  disabled = false,
  id,
  multiple = false,
  maxCount,
  maxTagCount = 'responsive',
  clearable = false,
  items = [],
  bindValue,
  bindLabel,
  bindDisabled,
  groupBy,
  searchable = false,
  showArrow = true,
  showLoading = false,
  virtualScroll = false,
  value,
  onChange,
  onSearch,
  onBlur,
  className,
}: LUISelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [scrollTop, setScrollTop] = useState(0);

  /** Number of tags that fit on one line — recomputed on resize / selection change (responsive mode). */
  const [responsiveCount, setResponsiveCount] = useState(999);

  // Fixed-position dropdown coordinates (computed from the trigger rect so the
  // menu escapes any `overflow` clipping on ancestor elements and can flip up).
  const [dropUp, setDropUp] = useState(false);
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuWidth, setMenuWidth] = useState(0);
  const [menuTop, setMenuTop] = useState<number | null>(null);
  const [menuBottom, setMenuBottom] = useState<number | null>(null);
  /** Max height of the scrollable option list, shrunk to fit the available space. */
  const [maxListHeight, setMaxListHeight] = useState(VIEWPORT_HEIGHT);

  const hostRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const tagsAreaRef = useRef<HTMLDivElement>(null);
  const tagsMeasureRef = useRef<HTMLDivElement>(null);

  // --- Derived option model ---

  const normalize = (item: unknown, index: number): NormalizedOption => {
    if (item !== null && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      const optionValue = bindValue ? record[bindValue] : item;
      const optionLabel = bindLabel
        ? String(record[bindLabel] ?? '')
        : String((bindValue ? optionValue : undefined) ?? item);
      return {
        value: optionValue,
        label: optionLabel,
        disabled: bindDisabled ? !!record[bindDisabled] : false,
        group: groupBy ? record[groupBy] : undefined,
        index,
      };
    }
    return { value: item, label: String(item), disabled: false, group: undefined, index };
  };

  /** Every item normalized, in source order — the source of truth for the selected label. */
  const all: NormalizedOption[] = items.map(normalize);

  /** Options surviving the current search text, re-indexed to their rendered position. */
  const filterVisible = (text: string): NormalizedOption[] => {
    const term = searchable ? text.trim().toLowerCase() : '';
    const matched = term ? all.filter((o) => o.label.toLowerCase().includes(term)) : all;
    return matched.map((o, index) => ({ ...o, index }));
  };

  const visible = filterVisible(searchText);

  /** Selected values as a flat array, regardless of single/multi mode. */
  const selectedArray: unknown[] = multiple
    ? Array.isArray(value)
      ? value
      : value == null
        ? []
        : [value]
    : [];

  /** The normalized options currently selected, in selection order — drives the trigger tags. */
  const selectedOptions = multiple
    ? selectedArray
        .map((v) => all.find((o) => o.value === v))
        .filter((o): o is NormalizedOption => !!o)
    : [];

  const isResponsive = multiple && maxTagCount === 'responsive';

  /** How many tags to render before the "+N" badge. */
  const visibleTagCount = typeof maxTagCount === 'number' ? maxTagCount : responsiveCount;
  const shownTags = selectedOptions.slice(0, visibleTagCount);
  const overflowCount = selectedOptions.length - shownTags.length;

  const limitReached = multiple && maxCount != null && selectedArray.length >= maxCount;

  const hasValue = multiple
    ? selectedArray.length > 0
    : value !== null && value !== undefined && value !== '';

  const showClear = clearable && hasValue && !disabled;

  const selectedLabel =
    value === null || value === undefined
      ? ''
      : (all.find((o) => o.value === value)?.label ?? '');

  const groups = (() => {
    if (!groupBy) return [];
    const map = new Map<unknown, { label: string; options: NormalizedOption[] }>();
    for (const option of visible) {
      let group = map.get(option.group);
      if (!group) {
        group = { label: option.group == null ? '' : String(option.group), options: [] };
        map.set(option.group, group);
      }
      group.options.push(option);
    }
    return [...map.values()];
  })();

  const useVirtual = virtualScroll && !groupBy;

  // --- Virtual scroll window ---

  const totalHeight = visible.length * ROW_HEIGHT;
  const viewportHeight = Math.min(totalHeight, maxListHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    visible.length,
    Math.ceil((scrollTop + maxListHeight) / ROW_HEIGHT) + OVERSCAN,
  );
  const windowRows = visible.slice(startIndex, endIndex);
  const offsetTop = startIndex * ROW_HEIGHT;

  // --- Selection helpers ---

  const isSelected = (v: unknown): boolean => {
    if (multiple) return selectedArray.includes(v);
    return value !== null && value !== undefined && v === value;
  };

  /** True when an option can't be picked — disabled at source, or the max-count limit is reached. */
  const optionDisabled = (option: NormalizedOption): boolean => {
    if (option.disabled) return true;
    return limitReached && !isSelected(option.value);
  };

  const firstSelectableOf = (list: NormalizedOption[]): number =>
    list.findIndex((o) => !optionDisabled(o));

  // --- Interaction ---

  /**
   * Position the fixed dropdown from the trigger's viewport rect. Anchors below
   * the trigger by default, flips above when there isn't room below, and caps
   * the option list height to the available space.
   */
  const reposition = () => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const gap = 4;
    const winHeight = window.innerHeight;
    const spaceBelow = winHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const reserve = (searchable ? 48 : 0) + 8; // search box + dropdown padding

    const up = spaceBelow < 180 && spaceAbove > spaceBelow;
    const available = up ? spaceAbove : spaceBelow;

    setDropUp(up);
    setMenuLeft(rect.left);
    setMenuWidth(rect.width);
    setMaxListHeight(Math.max(120, Math.min(VIEWPORT_HEIGHT, available - reserve)));

    if (up) {
      setMenuTop(null);
      setMenuBottom(winHeight - rect.top + gap);
    } else {
      setMenuTop(rect.bottom + gap);
      setMenuBottom(null);
    }
  };

  const scrollActiveIntoView = (index: number) => {
    const viewport = viewportRef.current;
    if (!viewport || index < 0) return;

    if (useVirtual) {
      const top = index * ROW_HEIGHT;
      const bottom = top + ROW_HEIGHT;
      if (top < viewport.scrollTop) viewport.scrollTop = top;
      else if (bottom > viewport.scrollTop + viewport.clientHeight)
        viewport.scrollTop = bottom - viewport.clientHeight;
    } else {
      viewport
        .querySelector<HTMLElement>(`[data-index="${index}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  };

  const openDropdown = () => {
    if (disabled) return;
    reposition();
    const selected = visible.findIndex((o) => o.value === value && !o.disabled);
    setActiveIndex(selected >= 0 ? selected : firstSelectableOf(visible));
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setSearchText('');
    setScrollTop(0);
    setActiveIndex(-1);
  };

  const toggle = () => {
    if (disabled) return;
    if (open) close();
    else openDropdown();
  };

  const select = (v: unknown) => {
    if (multiple) {
      const current = [...selectedArray];
      const at = current.indexOf(v);
      if (at >= 0) {
        current.splice(at, 1);
      } else {
        if (maxCount != null && current.length >= maxCount) return;
        current.push(v);
      }
      onChange?.(current);
      // Multi-select keeps the dropdown open so several picks can be made in a row.
      return;
    }

    onChange?.(v);
    close();
    triggerRef.current?.focus();
  };

  const onOptionClick = (option: NormalizedOption) => {
    if (optionDisabled(option)) return;
    select(option.value);
  };

  const setActive = (option: NormalizedOption) => {
    if (!optionDisabled(option)) setActiveIndex(option.index);
  };

  const removeTag = (option: NormalizedOption, event: MouseEvent) => {
    event.stopPropagation();
    if (disabled) return;
    select(option.value);
  };

  const clear = (event: MouseEvent) => {
    event.stopPropagation();
    if (disabled) return;
    const empty = multiple ? [] : null;
    onChange?.(empty);
    triggerRef.current?.focus();
  };

  const selectActive = () => {
    const option = visible[activeIndex];
    if (option && !optionDisabled(option)) select(option.value);
  };

  const move = (delta: number) => {
    if (!visible.length) return;

    let next = activeIndex;
    for (let i = 0; i < visible.length; i++) {
      next = (next + delta + visible.length) % visible.length;
      if (!optionDisabled(visible[next])) {
        setActiveIndex(next);
        break;
      }
    }
    const target = next;
    queueMicrotask(() => scrollActiveIntoView(target));
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
    setScrollTop(0);
    setActiveIndex(firstSelectableOf(filterVisible(text)));
  };

  const handleKeydown = (event: KeyboardEvent, fromSearch: boolean) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (open) move(1);
        else openDropdown();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (open) move(-1);
        else openDropdown();
        break;
      case 'Enter':
        event.preventDefault();
        if (open) selectActive();
        else openDropdown();
        break;
      case ' ':
        // The search box needs Space to type; elsewhere it opens/selects.
        if (fromSearch && open) break;
        event.preventDefault();
        if (open) selectActive();
        else openDropdown();
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          close();
        }
        break;
      case 'Tab':
        close();
        break;
    }
  };

  /** True when the node lives in the trigger host or the body-portaled dropdown. */
  const isInside = (node: Node | null) =>
    !!node && (!!hostRef.current?.contains(node) || !!dropdownRef.current?.contains(node));

  const handleFocusOut = (event: FocusEvent) => {
    // Only a focus leaving the whole component counts as a blur for touched-state.
    if (!isInside(event.relatedTarget as Node)) {
      onBlur?.();
    }
  };

  // Close on any pointer-down outside the component while open.
  useEffect(() => {
    if (!open) return;
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (!isInside(event.target as Node)) {
        close();
      }
    };
    document.addEventListener('pointerdown', onDocumentPointerDown);
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown);
  }, [open]);

  // Track the trigger position so the fixed menu stays anchored while scrolling.
  useEffect(() => {
    if (!open) return;
    const onViewportChange = () => reposition();
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    return () => {
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [open]);

  // After the dropdown renders: re-anchor, focus the search box, reveal the active row.
  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    searchInputRef.current?.focus();
    scrollActiveIntoView(activeIndex);
  }, [open]);

  // Re-measure how many tags fit whenever the rendered tags change (responsive mode).
  const measureTags = () => {
    if (!isResponsive) return;
    const area = tagsAreaRef.current;
    const measure = tagsMeasureRef.current;
    if (!area || !measure) return;

    const available = area.clientWidth;
    if (available <= 0) return;

    const tags = Array.from(measure.children) as HTMLElement[];
    let used = 0;
    let count = 0;
    for (let i = 0; i < tags.length; i++) {
      const width = tags[i].offsetWidth + (count > 0 ? TAG_GAP : 0);
      const reserve = i < tags.length - 1 ? TAG_BADGE_RESERVE + TAG_GAP : 0;
      if (count > 0 && used + width + reserve > available) break;
      used += width;
      count++;
    }
    setResponsiveCount(Math.max(1, count));
  };

  useLayoutEffect(() => {
    measureTags();
  });

  useEffect(() => {
    if (!isResponsive) return;
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(() => measureTags());
    observer.observe(host);
    return () => observer.disconnect();
  }, [isResponsive]);

  // --- Rendering ---

  const closeIcon = (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 5L5 15M5 5L15 15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const renderOption = (option: NormalizedOption) => (
    <div
      key={option.index}
      className={[
        'l-select__option',
        isSelected(option.value) ? 'is-selected' : '',
        activeIndex === option.index ? 'is-active' : '',
        optionDisabled(option) ? 'is-disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="option"
      style={{ height: ROW_HEIGHT }}
      data-index={option.index}
      aria-selected={isSelected(option.value)}
      aria-disabled={optionDisabled(option)}
      onClick={() => onOptionClick(option)}
      onMouseEnter={() => setActive(option)}
    >
      <span className="l-select__option-label">{option.label}</span>

      {isSelected(option.value) && (
        <svg
          className="l-select__check"
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16.6667 5L7.5 14.1667L3.33333 10"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );

  return (
    <div
      ref={hostRef}
      className={['form-group', 'lui-field', className ?? ''].filter(Boolean).join(' ')}
    >
      {label && <label htmlFor={selectId}>{label}</label>}

      <div className={['l-select', open ? 'is-open' : ''].filter(Boolean).join(' ')} onBlur={handleFocusOut}>
        <div
          ref={triggerRef}
          className={[
            'form-control',
            'l-select__trigger',
            !hasValue ? 'is-placeholder' : '',
            multiple ? 'is-multiple' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          id={selectId}
          role="combobox"
          tabIndex={disabled ? -1 : 0}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-disabled={disabled}
          aria-controls={`${selectId}-listbox`}
          onClick={toggle}
          onKeyDown={(event) => handleKeydown(event, false)}
        >
          {multiple ? (
            hasValue ? (
              <div ref={tagsAreaRef} className="l-select__tags">
                {shownTags.map((option) => (
                  <span key={String(option.value)} className="l-select__tag">
                    <span className="l-select__tag-label">{option.label}</span>
                    {!disabled && (
                      <button
                        type="button"
                        className="l-select__tag-remove"
                        tabIndex={-1}
                        aria-label={`Remove ${option.label}`}
                        onClick={(event) => removeTag(option, event)}
                      >
                        {closeIcon}
                      </button>
                    )}
                  </span>
                ))}
                {overflowCount > 0 && (
                  <span className="l-select__tag l-select__tag--count">+ {overflowCount} …</span>
                )}
              </div>
            ) : (
              <span className="l-select__label">{placeholder}</span>
            )
          ) : (
            <span className="l-select__label">{selectedLabel || placeholder}</span>
          )}

          <div className="l-select__affixes">
            {showClear && (
              <button
                type="button"
                className="l-select__clear"
                tabIndex={-1}
                aria-label="Clear selection"
                onClick={clear}
              >
                {closeIcon}
              </button>
            )}

            {showArrow && (
              <svg
                className="l-select__arrow"
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>

        {isResponsive && hasValue && (
          /* Off-screen mirror used only to measure how many tags fit on one line. */
          <div ref={tagsMeasureRef} className="l-select__tags-measure" aria-hidden="true">
            {selectedOptions.map((option) => (
              <span key={String(option.value)} className="l-select__tag">
                <span className="l-select__tag-label">{option.label}</span>
                {!disabled && <span className="l-select__tag-remove">{closeIcon}</span>}
              </span>
            ))}
          </div>
        )}

        {/* Portaled to <body> so an ancestor transform/filter (e.g. a drawer's or
            modal's settled animation) can never re-anchor the fixed-position menu. */}
        {open && createPortal(
          <div
            ref={dropdownRef}
            className={['l-select__dropdown', dropUp ? 'is-up' : ''].filter(Boolean).join(' ')}
            style={{
              left: menuLeft,
              width: menuWidth,
              top: menuTop ?? undefined,
              bottom: menuBottom ?? undefined,
            }}
          >
            {searchable && (
              <div className="l-select__search">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="l-select__search-input"
                  value={searchText}
                  placeholder="Search…"
                  autoComplete="off"
                  onChange={(event) => handleSearch(event.target.value)}
                  onKeyDown={(event) => handleKeydown(event, true)}
                />
              </div>
            )}

            {showLoading ? (
              <div className="l-select__status">
                <span className="l-select__spinner" aria-hidden="true"></span>
                <span>Loading…</span>
              </div>
            ) : visible.length === 0 ? (
              <div className="l-select__status l-select__status--empty">No results</div>
            ) : groupBy ? (
              <div
                ref={viewportRef}
                className="l-select__options"
                role="listbox"
                id={`${selectId}-listbox`}
                style={{ maxHeight: maxListHeight }}
              >
                {groups.map((group) => (
                  <Fragment key={group.label}>
                    <div className="l-select__group-label">{group.label}</div>
                    {group.options.map(renderOption)}
                  </Fragment>
                ))}
              </div>
            ) : useVirtual ? (
              <div
                ref={viewportRef}
                className="l-select__options"
                role="listbox"
                id={`${selectId}-listbox`}
                style={{ height: viewportHeight }}
                onScroll={(event: UIEvent<HTMLDivElement>) =>
                  setScrollTop(event.currentTarget.scrollTop)
                }
              >
                <div className="l-select__spacer" style={{ height: totalHeight }}>
                  <div style={{ transform: `translateY(${offsetTop}px)` }}>
                    {windowRows.map(renderOption)}
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={viewportRef}
                className="l-select__options"
                role="listbox"
                id={`${selectId}-listbox`}
                style={{ maxHeight: maxListHeight }}
              >
                {visible.map(renderOption)}
              </div>
            )}
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
}
