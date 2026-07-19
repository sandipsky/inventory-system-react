import { useEffect, useId, useRef, useState } from 'react';
import type {
  ChangeEvent,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import NepaliDate from './lib/nepali-date-converter';
import { dateConfigMap } from './lib/date-config';
import { format as formatBs, formatObj, parse as parseDateString } from './lib/nepali-date-helper';
import './date-input.css';

export type CalendarSystem = 'ad' | 'bs';

/** One cell of the 6×7 day grid. */
interface DayCell {
  key: number;
  label: string;
  /** AD date at local midnight — `null` only for cells outside the convertible BS range. */
  date: Date | null;
  aria: string;
  inMonth: boolean;
  today: boolean;
  selected: boolean;
  active: boolean;
  disabled: boolean;
}

interface MonthCell {
  index: number;
  label: string;
  selected: boolean;
}

interface YearCell {
  year: number;
  label: string;
  selected: boolean;
  disabled: boolean;
}

const AD_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const AD_MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const AD_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const AD_DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// The BS↔AD conversion table covers 2000–2090 BS; both calendars are clamped to
// that window so the AD/BS toggle can never land on an unconvertible month.
const BS_YEAR_MIN = 2000;
const BS_YEAR_MAX = 2090;
const AD_YEAR_MIN = 1944;
const AD_YEAR_MAX = 2033;

const PANEL_WIDTH = 288;
/** Rough panel height used to decide whether the popup should flip above the trigger. */
const PANEL_HEIGHT = 356;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** AD counterpart of the lib's BS `format()` — same token set, English names. */
function formatAd(date: Date, formatString: string): string {
  return formatString
    .replace(/((\\[MDYd])|D{1,2}|M{1,4}|Y{2,4}|d{1,3})/g, (match, _, escaped) => {
      switch (match) {
        case 'D':
          return String(date.getDate());
        case 'DD':
          return String(date.getDate()).padStart(2, '0');
        case 'M':
          return String(date.getMonth() + 1);
        case 'MM':
          return String(date.getMonth() + 1).padStart(2, '0');
        case 'MMM':
          return AD_MONTHS_SHORT[date.getMonth()];
        case 'MMMM':
          return AD_MONTHS_LONG[date.getMonth()];
        case 'YY':
          return String(date.getFullYear()).slice(-2);
        case 'YYY':
          return String(date.getFullYear()).slice(-3);
        case 'YYYY':
          return String(date.getFullYear());
        case 'd':
          return String(date.getDay());
        case 'dd':
          return AD_DAYS_SHORT[date.getDay()];
        case 'ddd':
          return AD_DAYS_LONG[date.getDay()];
        default:
          return escaped.replace('\\', '');
      }
    })
    .replace(/\\/g, '');
}

/** Accepts a `Date` or anything `new Date()` accepts; normalizes to local midnight. */
function normalizeValue(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : startOfDay(date);
}

function toBs(date: Date): { year: number; month: number; date: number; day?: number } | null {
  try {
    return new NepaliDate(date).getBS();
  } catch {
    return null;
  }
}

function bsToJs(year: number, month: number, date: number): Date | null {
  try {
    return new NepaliDate(year, month, date).toJsDate();
  } catch {
    return null;
  }
}

function daysInBsMonth(year: number, month: number): number {
  const config = dateConfigMap[String(year)];
  return config ? Object.values(config)[month] : 0;
}

function boundTime(bound: Date | string | null | undefined): number | null {
  if (bound == null || bound === '') return null;
  const date = bound instanceof Date ? bound : new Date(bound);
  return isNaN(date.getTime()) ? null : startOfDay(date).getTime();
}

export interface LUIDateInputProps {
  /** Label rendered above the field, linked to the input. */
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Id for the native input; auto-generated when omitted. */
  id?: string;

  /** Calendar system the picker starts in. The popup toggle can switch it later. */
  calendar?: CalendarSystem;
  /** Display language for the BS calendar — `np` renders Nepali month names and digits. */
  lang?: 'en' | 'np';
  /** Display format, using the lib's tokens (`YYYY`, `MM`, `DD`, `MMMM`, `dd`, …). */
  format?: string;
  /** Show the "Today" shortcut in the popup footer. */
  showToday?: boolean;
  /** Open the calendar as soon as the input gains focus (e.g. when tabbing in). */
  openCalendarOnFocus?: boolean;
  /** Show the calendar affix icon. */
  showCalendarIcon?: boolean;
  /** Allow editing the date by typing. `false` makes the field picker-only (read-only text). */
  typableDateInput?: boolean;
  /** Show a clear (×) affix when a date is picked. */
  clearable?: boolean;
  /** Earliest selectable date (inclusive). `Date` or anything `new Date()` accepts. */
  min?: Date | string | null;
  /** Latest selectable date (inclusive). */
  max?: Date | string | null;

  /**
   * Controlled value — always a JS `Date` (local midnight) regardless of which
   * calendar is displayed. ISO strings are also accepted and normalized.
   */
  value?: Date | string | null;
  /** Validation message shown under the field; also applies the error style. */
  error?: string;

  /** Called with the picked date (local midnight) or `null` when cleared. */
  onChange?: (value: Date | null) => void;
  /** Called when the user flips the AD/BS toggle. */
  onCalendarChange?: (calendar: CalendarSystem) => void;
}

/**
 * Date picker input inspired by Ant Design, with a twist for Nepal: the popup
 * calendar renders in either the Gregorian (AD) or Bikram Sambat (BS) system
 * and carries an AD/BS toggle so users can switch on the fly.
 *
 * The value is always a JS `Date` (local midnight), regardless of which
 * calendar is displayed — so forms stay calendar-agnostic. Typing is supported
 * (`YYYY-MM-DD`, `YYYY/MM/DD`, `DD-MM-YYYY`, …) and parsed in the active
 * calendar. This is a controlled component (`value` + `onChange`); with
 * react-hook-form, wrap it in a `<Controller>`.
 */
export function LUIDateInput({
  label = '',
  placeholder = 'Select date',
  disabled = false,
  id,
  calendar = 'ad',
  lang = 'en',
  format = 'YYYY-MM-DD',
  showToday = true,
  openCalendarOnFocus = false,
  showCalendarIcon = true,
  typableDateInput = true,
  clearable = true,
  min = null,
  max = null,
  value = null,
  error,
  onChange,
  onCalendarChange,
}: LUIDateInputProps) {
  const autoId = useId();
  const inputId = id ?? `l-date-input-${autoId}`;

  const selected = normalizeValue(value);
  const isDisabled = disabled;

  // Mirrors Angular's `linkedSignal(() => this.calendar())` — resets whenever
  // the `calendar` prop changes, but the popup toggle can override it locally.
  const [mode, setModeState] = useState<CalendarSystem>(calendar);
  const [prevCalendar, setPrevCalendar] = useState<CalendarSystem>(calendar);
  if (calendar !== prevCalendar) {
    setPrevCalendar(calendar);
    setModeState(calendar);
  }

  const [view, setView] = useState<'date' | 'month' | 'year'>('date');
  const [open, setOpen] = useState(false);

  // View anchor, expressed in the active calendar system (BS months while in BS mode).
  const [viewYear, setViewYear] = useState(0);
  const [viewMonth, setViewMonth] = useState(0);

  /** Keyboard-navigation cursor — always an AD date, like the value. */
  const [activeDate, setActiveDate] = useState<Date | null>(null);

  /** Raw text while the user is typing; `null` means "show the formatted value". */
  const [typedText, setTypedText] = useState<string | null>(null);

  const [todayTime, setTodayTime] = useState(() => startOfDay(new Date()).getTime());

  // Fixed-position panel coordinates (same approach as l-select: computed from the
  // trigger rect so the popup escapes ancestor `overflow` clipping and can flip up).
  const [dropUp, setDropUp] = useState(false);
  const [panelLeft, setPanelLeft] = useState(0);
  const [panelTop, setPanelTop] = useState<number | null>(null);
  const [panelBottom, setPanelBottom] = useState<number | null>(null);

  const hostRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  /** Suppresses `openCalendarOnFocus` when we refocus the field programmatically. */
  const skipFocusOpenRef = useRef(false);

  /** Latest "commit typed text and close" closure, for the document/viewport listeners. */
  const commitAndCloseRef = useRef<() => void>(() => {});

  // --- Derived state ---

  const minTime = boundTime(min);
  const maxTime = boundTime(max);

  const hasValue = selected !== null;
  const showClear = clearable && hasValue && !isDisabled;

  const displayValue = (() => {
    if (typedText !== null) return typedText;
    if (!selected) return '';
    if (mode === 'bs') {
      try {
        return new NepaliDate(selected).format(format, lang);
      } catch {
        // Value outside the BS table — fall back to the AD rendering.
      }
    }
    return formatAd(selected, format);
  })();

  const weekdays = mode === 'bs' && lang === 'np' ? formatObj.np.day.short : WEEKDAYS;

  const yearLabel = (year: number): string =>
    mode === 'bs' ? formatBs({ year, month: 0, date: 1 }, 'YYYY', lang) : String(year);

  const headerMonthLabel =
    mode === 'bs' ? formatObj[lang].month.long[viewMonth] : AD_MONTHS_SHORT[viewMonth];
  const headerYearLabel = yearLabel(viewYear);

  const yearPageStart = Math.floor(viewYear / 12) * 12;
  const yearRangeLabel = `${yearLabel(yearPageStart)} – ${yearLabel(yearPageStart + 11)}`;

  const outOfRange = (time: number): boolean =>
    (minTime !== null && time < minTime) || (maxTime !== null && time > maxTime);

  const yearBounds = (m: CalendarSystem = mode): [number, number] =>
    m === 'bs' ? [BS_YEAR_MIN, BS_YEAR_MAX] : [AD_YEAR_MIN, AD_YEAR_MAX];

  const cells: DayCell[] = (() => {
    if (!open || view !== 'date') return [];
    const first = mode === 'bs' ? bsToJs(viewYear, viewMonth, 1) : new Date(viewYear, viewMonth, 1);
    if (!first) return [];

    const startOffset = first.getDay();
    const selectedTime = selected?.getTime() ?? null;
    const activeTime = activeDate?.getTime() ?? null;

    const result: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(
        first.getFullYear(),
        first.getMonth(),
        first.getDate() + i - startOffset,
      );
      const time = date.getTime();

      let cellLabel: string;
      let aria: string;
      let inMonth: boolean;
      let convertible = true;

      if (mode === 'bs') {
        const bs = toBs(date);
        if (bs) {
          cellLabel = formatBs(bs, 'D', lang);
          aria = formatBs(bs, 'DD MMMM YYYY', lang);
          inMonth = bs.year === viewYear && bs.month === viewMonth;
        } else {
          cellLabel = '';
          aria = '';
          inMonth = false;
          convertible = false;
        }
      } else {
        cellLabel = String(date.getDate());
        aria = formatAd(date, 'DD MMMM YYYY');
        inMonth = date.getMonth() === viewMonth;
      }

      result.push({
        key: i,
        label: cellLabel,
        date: convertible ? date : null,
        aria,
        inMonth,
        today: time === todayTime,
        selected: selectedTime !== null && time === selectedTime,
        active: activeTime !== null && time === activeTime,
        disabled: !convertible || outOfRange(time),
      });
    }
    return result;
  })();

  const monthCells: MonthCell[] = (() => {
    if (!open || view !== 'month') return [];
    const names = mode === 'bs' ? formatObj[lang].month.long : AD_MONTHS_SHORT;
    return names.map((monthLabel, index) => ({
      index,
      label: monthLabel,
      selected: index === viewMonth,
    }));
  })();

  const yearCells: YearCell[] = (() => {
    if (!open || view !== 'year') return [];
    const [minYear, maxYear] = yearBounds();
    return Array.from({ length: 12 }, (_, i) => {
      const year = yearPageStart + i;
      return {
        year,
        label: yearLabel(year),
        selected: year === viewYear,
        disabled: year < minYear || year > maxYear,
      };
    });
  })();

  // --- Value & conversion helpers ---

  const commitValue = (next: Date | null): void => {
    onChange?.(next ? startOfDay(next) : null);
  };

  /** Point the view at the month containing `date`, in the active calendar system. */
  const syncView = (date: Date, m: CalendarSystem = mode): void => {
    if (m === 'bs') {
      const bs = toBs(date) ?? toBs(new Date());
      if (bs) {
        setViewYear(bs.year);
        setViewMonth(bs.month);
        return;
      }
    }
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  };

  const commitTyped = (): void => {
    if (typedText === null) return;
    setTypedText(null);

    const text = typedText.trim();
    if (!text) {
      if (hasValue) commitValue(null);
      return;
    }

    try {
      const { year, month, date } = parseDateString(text);
      let parsed: Date | null = null;
      if (mode === 'bs') {
        if (month >= 0 && month <= 11 && date >= 1 && date <= daysInBsMonth(year, month)) {
          parsed = bsToJs(year, month, date);
        }
      } else {
        const candidate = new Date(year, month, date);
        const roundTrips =
          candidate.getFullYear() === year &&
          candidate.getMonth() === month &&
          candidate.getDate() === date;
        parsed = roundTrips ? candidate : null;
      }
      if (parsed && !outOfRange(parsed.getTime())) {
        commitValue(parsed);
        setActiveDate(parsed);
        syncView(parsed);
      }
    } catch {
      // Unparseable text — revert to the last committed value.
    }
  };

  // --- Open / close / position ---

  const reposition = (): void => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const up = spaceBelow < PANEL_HEIGHT && spaceAbove > spaceBelow;

    setDropUp(up);
    setPanelLeft(Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 8)));
    if (up) {
      setPanelTop(null);
      setPanelBottom(window.innerHeight - rect.top + gap);
    } else {
      setPanelTop(rect.bottom + gap);
      setPanelBottom(null);
    }
  };

  const openPanel = (): void => {
    if (isDisabled || open) return;
    setTodayTime(startOfDay(new Date()).getTime());
    setView('date');
    const anchor = selected ?? startOfDay(new Date());
    setActiveDate(anchor);
    syncView(anchor);
    setOpen(true);
    reposition();
    queueMicrotask(() => reposition());
  };

  /** Focus the field without re-triggering `openCalendarOnFocus`. */
  const refocusField = (): void => {
    skipFocusOpenRef.current = true;
    fieldRef.current?.focus();
    queueMicrotask(() => {
      skipFocusOpenRef.current = false;
    });
  };

  const closePanel = (refocus = true): void => {
    if (!open) return;
    setOpen(false);
    if (refocus) refocusField();
  };

  useEffect(() => {
    commitAndCloseRef.current = () => {
      commitTyped();
      closePanel(false);
    };
  });

  // Close on outside pointerdown, committing any typed text first.
  useEffect(() => {
    if (!open) return;
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (hostRef.current && !hostRef.current.contains(event.target as Node)) {
        commitAndCloseRef.current();
      }
    };
    document.addEventListener('pointerdown', onDocumentPointerDown);
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown);
  }, [open]);

  // Track viewport scroll/resize while open so the fixed panel follows the trigger.
  useEffect(() => {
    if (!open) return;
    const onViewportChange = () => reposition();
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    return () => {
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
    };
    // `reposition` only touches refs and state setters, so a stale closure is harmless.
  }, [open]);

  // --- Trigger interaction ---

  const handleTriggerClick = (): void => {
    if (isDisabled) return;
    openPanel();
    fieldRef.current?.focus();
  };

  const handleFocus = (): void => {
    if (skipFocusOpenRef.current) return;
    if (openCalendarOnFocus && !isDisabled) openPanel();
  };

  const handleTyped = (event: ChangeEvent<HTMLInputElement>): void => {
    const field = event.target;
    if (!typableDateInput) {
      field.value = displayValue;
      return;
    }
    // Only date-shaped text is accepted: digits plus the separators the parser
    // understands (`/`, `-`, space), capped at YYYY-MM-DD length.
    const sanitized = field.value.replace(/[^\d/\- ]/g, '').slice(0, 10);
    if (sanitized !== field.value) {
      const caret = Math.max(
        0,
        (field.selectionStart ?? sanitized.length) - (field.value.length - sanitized.length),
      );
      field.value = sanitized;
      field.setSelectionRange(caret, caret);
    }
    setTypedText(sanitized);
    if (!open) openPanel();
  };

  const handleInputKeydown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        commitTyped();
        closePanel();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openPanel();
        queueMicrotask(() => gridRef.current?.focus());
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setTypedText(null);
          closePanel(false);
        }
        break;
      case 'Tab':
        commitTyped();
        closePanel(false);
        break;
    }
  };

  const handleFocusOut = (event: ReactFocusEvent<HTMLDivElement>): void => {
    // Only a focus leaving the whole component counts — the panel lives inside the host.
    if (hostRef.current && !hostRef.current.contains(event.relatedTarget as Node | null)) {
      commitTyped();
      closePanel(false);
    }
  };

  const handleClear = (event: ReactMouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (isDisabled) return;
    setTypedText(null);
    commitValue(null);
    refocusField();
  };

  // --- Panel navigation ---

  const shiftMonth = (delta: number): void => {
    let month = viewMonth + delta;
    let year = viewYear;
    while (month < 0) {
      month += 12;
      year--;
    }
    while (month > 11) {
      month -= 12;
      year++;
    }
    const [minYear, maxYear] = yearBounds();
    if (year < minYear) {
      year = minYear;
      month = 0;
    } else if (year > maxYear) {
      year = maxYear;
      month = 11;
    }
    setViewYear(year);
    setViewMonth(month);
  };

  const shiftYear = (delta: number): void => {
    const [minYear, maxYear] = yearBounds();
    setViewYear(Math.max(minYear, Math.min(maxYear, viewYear + delta)));
  };

  const prev = (): void => {
    if (view === 'year') shiftYear(-12);
    else if (view === 'month') shiftYear(-1);
    else shiftMonth(-1);
  };

  const next = (): void => {
    if (view === 'year') shiftYear(12);
    else if (view === 'month') shiftYear(1);
    else shiftMonth(1);
  };

  const superPrev = (): void => shiftYear(view === 'year' ? -12 : -1);
  const superNext = (): void => shiftYear(view === 'year' ? 12 : 1);

  const selectMonth = (index: number): void => {
    setViewMonth(index);
    setView('date');
  };

  const selectYear = (cell: YearCell): void => {
    if (cell.disabled) return;
    setViewYear(cell.year);
    setView('month');
  };

  const selectDay = (cell: DayCell): void => {
    if (cell.disabled || !cell.date) return;
    commitValue(cell.date);
    setActiveDate(cell.date);
    closePanel();
  };

  const selectToday = (): void => {
    const today = startOfDay(new Date());
    if (outOfRange(today.getTime())) return;
    commitValue(today);
    setActiveDate(today);
    closePanel();
  };

  const setMode = (next: CalendarSystem): void => {
    if (mode === next || isDisabled) return;
    setModeState(next);
    setTypedText(null);
    setView('date');
    syncView(selected ?? activeDate ?? startOfDay(new Date()), next);
    onCalendarChange?.(next);
  };

  // --- Day-grid keyboard navigation ---

  const setActive = (date: Date): void => {
    if (mode === 'bs' && !toBs(date)) return;
    setActiveDate(date);
    syncView(date);
  };

  const moveActive = (deltaDays: number): void => {
    const base = activeDate ?? selected ?? startOfDay(new Date());
    setActive(new Date(base.getFullYear(), base.getMonth(), base.getDate() + deltaDays));
  };

  const moveActiveMonth = (delta: number): void => {
    const base = activeDate ?? selected ?? startOfDay(new Date());
    if (mode === 'bs') {
      try {
        const nd = new NepaliDate(base);
        const day = Math.min(nd.getDate(), 29); // every BS month has ≥ 29 days
        const bsNext = new NepaliDate(nd.getYear(), nd.getMonth() + delta, day);
        setActive(bsNext.toJsDate());
      } catch {
        // Landed outside the BS table — stay put.
      }
      return;
    }
    const daysInTarget = new Date(base.getFullYear(), base.getMonth() + delta + 1, 0).getDate();
    setActive(
      new Date(base.getFullYear(), base.getMonth() + delta, Math.min(base.getDate(), daysInTarget)),
    );
  };

  const handleGridKeydown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        moveActive(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActive(-7);
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveActive(7);
        break;
      case 'PageUp':
        event.preventDefault();
        moveActiveMonth(-1);
        break;
      case 'PageDown':
        event.preventDefault();
        moveActiveMonth(1);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (activeDate && !outOfRange(activeDate.getTime())) {
          commitValue(activeDate);
          closePanel();
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        closePanel(false);
        break;
      case 'Tab':
        closePanel(false);
        break;
    }
  };

  // --- Render ---

  return (
    <div className="form-group lui-field" ref={hostRef}>
      {label && <label htmlFor={inputId}>{label}</label>}

      <div className={`l-date-input${open ? ' is-open' : ''}`} onBlur={handleFocusOut}>
        <div
          ref={triggerRef}
          className="form-control l-date-input__trigger"
          aria-disabled={isDisabled}
          onClick={handleTriggerClick}
        >
          <input
            ref={fieldRef}
            type="text"
            className={`l-date-input__field${!typableDateInput ? ' is-readonly' : ''}`}
            id={inputId}
            value={displayValue}
            placeholder={placeholder}
            disabled={isDisabled}
            readOnly={!typableDateInput}
            autoComplete="off"
            role="combobox"
            aria-haspopup="dialog"
            aria-expanded={open}
            onFocus={handleFocus}
            onChange={handleTyped}
            onKeyDown={handleInputKeydown}
          />

          <div className="l-date-input__affixes">
            {showClear && (
              <button
                type="button"
                className="l-date-input__clear"
                tabIndex={-1}
                aria-label="Clear date"
                onClick={handleClear}
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M15 5L5 15M5 5L15 15"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            {showCalendarIcon && (
              <svg
                className="l-date-input__icon"
                width="15"
                height="15"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="2.75"
                  y="4.25"
                  width="14.5"
                  height="13"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M2.75 8.25H17.25M6.5 2.5V5.5M13.5 2.5V5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        </div>

        {open && (
          <div
            className={`l-date-input__panel${dropUp ? ' is-up' : ''}`}
            role="dialog"
            aria-label="Choose date"
            style={{
              left: panelLeft,
              top: panelTop ?? undefined,
              bottom: panelBottom ?? undefined,
            }}
          >
            <div className="l-date-input__header">
              <button
                type="button"
                className="l-date-input__nav"
                aria-label="Previous year"
                onClick={superPrev}
              >
                «
              </button>
              <button
                type="button"
                className="l-date-input__nav"
                aria-label="Previous month"
                onClick={prev}
              >
                ‹
              </button>

              <div className="l-date-input__header-label">
                {view === 'year' ? (
                  <span className="l-date-input__header-range">{yearRangeLabel}</span>
                ) : (
                  <>
                    {view === 'date' && (
                      <button
                        type="button"
                        className="l-date-input__header-btn"
                        onClick={() => setView('month')}
                      >
                        {headerMonthLabel}
                      </button>
                    )}
                    <button
                      type="button"
                      className="l-date-input__header-btn"
                      onClick={() => setView('year')}
                    >
                      {headerYearLabel}
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                className="l-date-input__nav"
                aria-label="Next month"
                onClick={next}
              >
                ›
              </button>
              <button
                type="button"
                className="l-date-input__nav"
                aria-label="Next year"
                onClick={superNext}
              >
                »
              </button>
            </div>

            {view === 'date' && (
              <>
                <div className="l-date-input__weekdays" aria-hidden="true">
                  {weekdays.map((day) => (
                    <span key={day} className="l-date-input__weekday">
                      {day}
                    </span>
                  ))}
                </div>

                <div
                  ref={gridRef}
                  className="l-date-input__grid"
                  role="grid"
                  tabIndex={0}
                  aria-label="Calendar days"
                  onKeyDown={handleGridKeydown}
                >
                  {cells.map((cell) => (
                    <button
                      key={cell.key}
                      type="button"
                      className={[
                        'l-date-input__cell',
                        !cell.inMonth ? 'is-outside' : '',
                        cell.today ? 'is-today' : '',
                        cell.selected ? 'is-selected' : '',
                        cell.active ? 'is-active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      role="gridcell"
                      tabIndex={-1}
                      disabled={cell.disabled}
                      aria-selected={cell.selected}
                      aria-label={cell.aria || undefined}
                      onClick={() => selectDay(cell)}
                    >
                      {cell.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {view === 'month' && (
              <div className="l-date-input__months">
                {monthCells.map((month) => (
                  <button
                    key={month.index}
                    type="button"
                    className={`l-date-input__unit${month.selected ? ' is-selected' : ''}`}
                    onClick={() => selectMonth(month.index)}
                  >
                    {month.label}
                  </button>
                ))}
              </div>
            )}

            {view === 'year' && (
              <div className="l-date-input__years">
                {yearCells.map((year) => (
                  <button
                    key={year.year}
                    type="button"
                    className={`l-date-input__unit${year.selected ? ' is-selected' : ''}`}
                    disabled={year.disabled}
                    onClick={() => selectYear(year)}
                  >
                    {year.label}
                  </button>
                ))}
              </div>
            )}

            <div className="l-date-input__footer">
              <div className="l-date-input__mode" role="group" aria-label="Calendar system">
                <button
                  type="button"
                  className={`l-date-input__mode-btn${mode === 'ad' ? ' is-active' : ''}`}
                  aria-pressed={mode === 'ad'}
                  onClick={() => setMode('ad')}
                >
                  AD
                </button>
                <button
                  type="button"
                  className={`l-date-input__mode-btn${mode === 'bs' ? ' is-active' : ''}`}
                  aria-pressed={mode === 'bs'}
                  onClick={() => setMode('bs')}
                >
                  BS
                </button>
              </div>

              {showToday && (
                <button type="button" className="l-date-input__today" onClick={selectToday}>
                  Today
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}
    </div>
  );
}
