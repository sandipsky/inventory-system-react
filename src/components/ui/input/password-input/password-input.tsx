import {
  useId,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type KeyboardEvent,
} from 'react';
import './password-input.css';

export interface LUIPasswordInputProps
  extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'type'> {
  /** Label rendered above the field, linked to the input. */
  label?: string;

  /** Validation message shown under the field; also applies the error style. */
  error?: string;

  /** Show the password-requirements checklist below the field. */
  showRules?: boolean;

  /** Called when Enter is pressed in the field. */
  onEnter?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Password field with a lock icon and a show/hide visibility toggle. Works
 * uncontrolled with react-hook-form's `register()` spread and as a plain
 * controlled component. The toggle only switches the rendered input `type`;
 * the value never changes.
 */
export function LUIPasswordInput({
  label,
  error,
  showRules = false,
  onEnter,
  onKeyDown,
  onChange,
  id,
  required,
  disabled,
  className,
  ...rest
}: LUIPasswordInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const [visible, setVisible] = useState(false);

  /* Mirror of the typed value, used only to drive the rules checklist; the
     input itself stays uncontrolled unless the consumer passes `value`. */
  const [internalValue, setInternalValue] = useState(() => String(rest.defaultValue ?? ''));
  const value = rest.value != null ? String(rest.value) : internalValue;

  const hasMinLength = value.length >= 8;
  const hasUpperLower = /[a-z]/.test(value) && /[A-Z]/.test(value);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(value);
  const hasNumber = /\d/.test(value);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInternalValue(event.target.value);
    onChange?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.key === 'Enter') onEnter?.(event);
  };

  return (
    <div className="form-group lui-field">
      {label && (
        <label htmlFor={inputId}>
          {label}
          {required && <span> *</span>}
        </label>
      )}

      <div className="input-wrapper">
        <span className="left-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10 2.33301C12.3929 2.33318 14.3336 4.27319 14.334 6.66602V9.00781C15.7285 9.09423 16.8336 10.2498 16.834 11.666V15C16.8338 16.4725 15.6395 17.6658 14.167 17.666H5.83398C4.36133 17.666 3.16717 16.4726 3.16699 15V11.666C3.16733 10.2496 4.27217 9.09392 5.66699 9.00781V6.66602C5.66734 4.27319 7.60713 2.33318 10 2.33301ZM5.83398 11C5.46601 11 5.16734 11.2981 5.16699 11.666V15C5.16717 15.368 5.4659 15.666 5.83398 15.666H14.167C14.5349 15.6658 14.8338 15.3679 14.834 15V11.666C14.8336 11.2982 14.5348 11.0002 14.167 11H5.83398ZM10 12.292C10.5752 12.292 11.0418 12.7579 11.042 13.333C11.042 13.9083 10.5753 14.375 10 14.375C9.4247 14.375 8.95801 13.9083 8.95801 13.333C8.95818 12.7579 9.42481 12.292 10 12.292ZM10 4.33301C8.7117 4.33318 7.66734 5.37776 7.66699 6.66602V9H12.334V6.66602C12.3336 5.37776 11.2883 4.33318 10 4.33301Z"
              fill="#646663"
            />
          </svg>
        </span>

        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={['form-control', error ? 'error' : '', className ?? ''].filter(Boolean).join(' ')}
          required={required}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          {...rest}
        />

        <button
          type="button"
          className="right-icon clickable"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12.9833 9.99993C12.9833 11.6499 11.6499 12.9833 9.99993 12.9833C8.34993 12.9833 7.0166 11.6499 7.0166 9.99993C7.0166 8.34993 8.34993 7.0166 9.99993 7.0166C11.6499 7.0166 12.9833 8.34993 12.9833 9.99993Z"
                stroke="#4B5563"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.99987 16.8918C12.9415 16.8918 15.6832 15.1584 17.5915 12.1584C18.3415 10.9834 18.3415 9.00843 17.5915 7.83343C15.6832 4.83343 12.9415 3.1001 9.99987 3.1001C7.0582 3.1001 4.31654 4.83343 2.4082 7.83343C1.6582 9.00843 1.6582 10.9834 2.4082 12.1584C4.31654 15.1584 7.0582 16.8918 9.99987 16.8918Z"
                stroke="#4B5563"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14.53 9.46992L9.47001 14.5299C8.82001 13.8799 8.42001 12.9899 8.42001 11.9999C8.42001 10.0199 10.02 8.41992 12 8.41992C12.99 8.41992 13.88 8.81992 14.53 9.46992Z"
                stroke="#4B5563"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.82 5.76998C16.07 4.44998 14.07 3.72998 12 3.72998C8.47 3.72998 5.18 5.80998 2.89 9.40998C1.99 10.82 1.99 13.19 2.89 14.6C3.68 15.84 4.6 16.91 5.6 17.77"
                stroke="#4B5563"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.42001 19.5302C9.56001 20.0102 10.77 20.2702 12 20.2702C15.53 20.2702 18.82 18.1902 21.11 14.5902C22.01 13.1802 22.01 10.8102 21.11 9.40018C20.78 8.88018 20.42 8.39018 20.05 7.93018"
                stroke="#4B5563"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15.51 12.7002C15.25 14.1102 14.1 15.2602 12.69 15.5202"
                stroke="#4B5563"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.47 14.5298L2 21.9998"
                stroke="#4B5563"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L14.53 9.47"
                stroke="#4B5563"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {showRules && (
        <div className="password-rules">
          <p>Password must have :</p>

          <div className={`rule${hasMinLength ? ' valid' : ''}`}>
            <span></span> At least 8 characters
          </div>
          <div className={`rule${hasUpperLower ? ' valid' : ''}`}>
            <span></span> Uppercase and lowercase character (A–a)
          </div>
          <div className={`rule${hasSpecialChar ? ' valid' : ''}`}>
            <span></span> One Special character (!, @, #, $, % ...)
          </div>
          <div className={`rule${hasNumber ? ' valid' : ''}`}>
            <span></span> One number (1–9)
          </div>
        </div>
      )}
    </div>
  );
}
