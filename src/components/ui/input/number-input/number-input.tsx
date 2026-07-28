import {
  useId,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import '../form.css';
import './number-input.css';

const NAV_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Enter',
  'Escape',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

export interface LUINumberInputProps
  extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'type' | 'prefix'> {
  /** Label rendered above the field, linked to the input. */
  label?: string;

  /** Validation message shown under the field; also applies the error style. */
  error?: string;

  /**
   * `0` forbids decimals; a positive number rounds the value to that many
   * places on blur; left unset, any number of decimals is allowed.
   */
  decimalPlaces?: number;

  /** Display-only adornment before the value — it never becomes part of the value. */
  prefix?: string;

  /** Display-only adornment after the value — it never becomes part of the value. */
  suffix?: string;

  /** Allow typing negative numbers. Off by default (the `-` key is blocked). */
  allowNegative?: boolean;

  /** Allow a value of `0`. On by default; when off, typing a bare `0` is blocked. */
  allowZero?: boolean;

  /**
   * Called with the parsed numeric value on every change — `null` while the
   * field is empty or incomplete.
   */
  onValueChange?: (value: number | null) => void;
}

function parse(s: string): number | null {
  if (s === '' || s === '-' || s === '.' || s === '-.') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Numeric field rendered as a native text input with numeric keystroke
 * filtering — non-numeric keys are blocked outright, and an optional
 * `prefix`/`suffix` are shown as static, non-editable adornments that never
 * become part of the value. Works uncontrolled with react-hook-form's
 * `register()` spread; like any native input, the form value is a string —
 * use `onValueChange` (or `register(..., { setValueAs })`) for the parsed
 * number.
 */
export function LUINumberInput({
  label,
  error,
  decimalPlaces,
  prefix = '',
  suffix = '',
  allowNegative = false,
  allowZero = true,
  onValueChange,
  onChange,
  onBlur,
  onKeyDown,
  id,
  required,
  className,
  ...rest
}: LUINumberInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const inputMode = decimalPlaces === 0 ? 'numeric' : 'decimal';

  /** Safety net for pasted text — strips anything the keystroke filter would have blocked. */
  const sanitize = (raw: string): string => {
    const negative = allowNegative && raw.trimStart().startsWith('-');
    let s = raw.replace(/[^0-9.]/g, '');

    if (decimalPlaces === 0) {
      s = s.replace(/\./g, '');
    } else {
      const dot = s.indexOf('.');
      if (dot !== -1) {
        s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
      }
    }

    s = s.replace(/^0+(?=\d)/, '');
    return (negative ? '-' : '') + s;
  };

  /** Decides whether a printable key may be inserted at the current caret/selection. */
  const isKeyAllowed = (key: string, input: HTMLInputElement): boolean => {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const prospective = input.value.slice(0, start) + key + input.value.slice(end);

    if (key === '-') {
      return allowNegative && start === 0 && !input.value.includes('-');
    }

    if (key === '.') {
      return decimalPlaces !== 0 && !input.value.includes('.');
    }

    if (key >= '0' && key <= '9') {
      if (!allowZero && parse(sanitize(prospective)) === 0) return false;
      return true;
    }

    return false;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);

    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (NAV_KEYS.has(event.key)) return;
    if (event.key.length !== 1) return;

    if (!isKeyAllowed(event.key, event.currentTarget)) {
      event.preventDefault();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitize(event.target.value);
    if (cleaned !== event.target.value) event.target.value = cleaned;

    onChange?.(event);
    onValueChange?.(parse(cleaned));
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    let value = parse(event.target.value);

    if (value !== null && decimalPlaces !== undefined) value = round(value, decimalPlaces);
    if (value === 0 && !allowZero) value = null;

    const formatted =
      value === null ? '' : decimalPlaces !== undefined ? value.toFixed(decimalPlaces) : String(value);

    if (formatted !== event.target.value) {
      event.target.value = formatted;
      onValueChange?.(value);
    }

    onBlur?.(event);
  };

  return (
    <div className="form-group lui-field">
      {label && (
        <label htmlFor={inputId}>
          {label}
          {required && <span> *</span>}
        </label>
      )}

      <div
        className={['input-affix', prefix ? 'has-prefix' : '', suffix ? 'has-suffix' : '']
          .filter(Boolean)
          .join(' ')}
      >
        {prefix && <span className="affix prefix">{prefix}</span>}

        <input
          id={inputId}
          type="text"
          inputMode={inputMode}
          className={['form-control', error ? 'error' : '', className ?? ''].filter(Boolean).join(' ')}
          required={required}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onBlur={handleBlur}
          {...rest}
        />

        {suffix && <span className="affix suffix">{suffix}</span>}
      </div>

      {error && <div className="alert error">{error}</div>}
    </div>
  );
}
