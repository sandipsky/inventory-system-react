import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import './otp-input.css';

export type OtpSize = 'sm' | 'md' | 'lg';
/** `number` restricts entry to digits; `text` allows any non-space character. */
export type OtpType = 'number' | 'text';

/** Distribute `value` across `length` boxes, one character per box. */
const _toChars = (value: string, length: number): string[] => {
  const chars = [...value].slice(0, length);
  while (chars.length < length) chars.push('');
  return chars;
};

export interface LUIOtpInputProps {
  /** Controlled value — the concatenated string of all boxes. */
  value?: string;
  /** Called with the full value on every change. */
  onChange?: (value: string) => void;
  /** Called once every box is filled. */
  onCompleted?: (value: string) => void;
  /** Called when a box loses focus — wire to react-hook-form Controller's `field.onBlur`. */
  onBlur?: () => void;
  /** Number of character boxes. */
  length?: number;
  type?: OtpType;
  /** Hide the entered characters as dots (PIN mode). */
  mask?: boolean;
  size?: OtpSize;
  disabled?: boolean;
  /** Paint the boxes in the error color. */
  error?: boolean;
  /** Focus the first box on render. */
  autoFocus?: boolean;
  /** A `-` between every box, e.g. `123-456`. */
  separator?: boolean;
  ariaLabel?: string;
  /** Base name for the native inputs (each box appends its index); auto-generated when omitted. */
  name?: string;
  className?: string;
}

/**
 * OTP / PIN input — a row of single-character boxes for one-time codes and
 * PINs, in the spirit of Ant Design's `Input.OTP` and Mantine's `PinInput`.
 * Typing advances to the next box, Backspace walks back, arrow keys move the
 * caret, and pasting a code distributes it across the boxes. Set `mask` to hide
 * the entered characters (dots) for PIN entry.
 *
 * A controlled component: pass `value` and `onChange(value)`. With
 * react-hook-form, wrap it in a `<Controller>`.
 *
 * ```tsx
 * <LUIOtpInput length={6} value={code} onChange={setCode} onCompleted={verify} />
 * <LUIOtpInput length={4} mask type="number" />
 * ```
 */
export function LUIOtpInput({
  value,
  onChange,
  onCompleted,
  onBlur,
  length = 6,
  type = 'number',
  mask = false,
  size = 'md',
  disabled = false,
  error = false,
  autoFocus = false,
  separator = false,
  ariaLabel = 'One-time code',
  name,
  className,
}: LUIOtpInputProps) {
  const autoId = useId();
  const inputName = name ?? `l-otp-${autoId}`;

  /* The boxes are the source of truth so partially-filled codes keep their
     positions; the `value` prop re-distributes only when it actually differs. */
  const [chars, setChars] = useState<string[]>(() => _toChars(value ?? '', length));

  if (value !== undefined && value !== chars.join('')) {
    setChars(_toChars(value, length));
  } else if (chars.length !== length) {
    // Keep the backing array sized to `length`, preserving already-typed chars.
    const next = chars.slice(0, length);
    while (next.length < length) next.push('');
    setChars(next);
  }

  const cells = useRef<(HTMLInputElement | null)[]>([]);

  const isAllowed = (char: string): boolean =>
    type === 'number' ? /[0-9]/.test(char) : /\S/.test(char);

  const focusCell = (index: number): void => {
    const clamped = Math.max(0, Math.min(index, length - 1));
    const el = cells.current[clamped];
    el?.focus();
    el?.select();
  };

  const commit = (next: string[]): void => {
    setChars(next);
    const nextValue = next.join('');
    onChange?.(nextValue);
    if (next.length > 0 && next.every((c) => c !== '')) {
      onCompleted?.(nextValue);
    }
  };

  const setChar = (index: number, char: string): void => {
    const next = chars.slice();
    next[index] = char;
    commit(next);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>, index: number): void => {
    const el = event.target;
    const char = el.value.slice(-1);
    if (char && !isAllowed(char)) {
      el.value = chars[index] ?? '';
      return;
    }
    setChar(index, char);
    if (char) focusCell(index + 1);
  };

  const handleKeydown = (event: KeyboardEvent<HTMLInputElement>, index: number): void => {
    switch (event.key) {
      case 'Backspace':
        event.preventDefault();
        if (chars[index]) {
          setChar(index, '');
        } else if (index > 0) {
          setChar(index - 1, '');
          focusCell(index - 1);
        }
        break;
      case 'Delete':
        event.preventDefault();
        setChar(index, '');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        focusCell(index - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        focusCell(index + 1);
        break;
      case 'Home':
        event.preventDefault();
        focusCell(0);
        break;
      case 'End':
        event.preventDefault();
        focusCell(length - 1);
        break;
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>, index: number): void => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const incoming = [...text].filter((c) => isAllowed(c));
    if (!incoming.length) return;

    const next = chars.slice();
    let pos = index;
    for (const c of incoming) {
      if (pos >= next.length) break;
      next[pos++] = c;
    }
    commit(next);
    focusCell(pos);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>): void => {
    // Select the box so the next keystroke overwrites it.
    event.target.select();
  };

  /* Focus the first box on render when `autoFocus` is set. */
  useEffect(() => {
    if (autoFocus && !disabled) focusCell(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hostClasses = [
    'l-otp',
    `l-otp--${size}`,
    error ? 'is-error' : '',
    disabled ? 'is-disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={hostClasses} role="group" aria-label={ariaLabel}>
      <div className="l-otp__boxes">
        {chars.map((char, i) => (
          <Fragment key={i}>
            <input
              ref={(el) => {
                cells.current[i] = el;
              }}
              className={char ? 'l-otp__box is-filled' : 'l-otp__box'}
              type={mask ? 'password' : 'text'}
              inputMode={type === 'number' ? 'numeric' : 'text'}
              value={char}
              disabled={disabled}
              name={`${inputName}-${i}`}
              aria-label={`Character ${i + 1} of ${length}`}
              autoComplete="one-time-code"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={1}
              onChange={(event) => handleInput(event, i)}
              onKeyDown={(event) => handleKeydown(event, i)}
              onPaste={(event) => handlePaste(event, i)}
              onFocus={handleFocus}
              onBlur={() => onBlur?.()}
            />

            {separator && i < length - 1 && (
              <span className="l-otp__separator" aria-hidden="true">
                –
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
