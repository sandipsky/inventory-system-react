import { useId, type ComponentPropsWithRef, type KeyboardEvent } from 'react';

export interface LUIEmailInputProps extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'type'> {
  /** Label rendered above the field, linked to the input. */
  label?: string;

  /** Validation message shown under the field; also applies the error style. */
  error?: string;

  /** Called when Enter is pressed in the field. */
  onEnter?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Email field with a mail icon. Works uncontrolled with react-hook-form's
 * `register()` spread and as a plain controlled component. Unlike the Angular
 * version there is no built-in format validator — validate in the consumer
 * (e.g. zod + react-hook-form) and pass the message via `error`.
 */
export function LUIEmailInput({
  label,
  error,
  onEnter,
  onKeyDown,
  id,
  required,
  className,
  ...rest
}: LUIEmailInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

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
              d="M5 6.66675L8.50929 8.42139C9.44771 8.8906 10.5523 8.8906 11.4907 8.42139L15 6.66675M5 15.8334H15C16.3807 15.8334 17.5 14.7141 17.5 13.3334V6.66675C17.5 5.28604 16.3807 4.16675 15 4.16675H5C3.61929 4.16675 2.5 5.28604 2.5 6.66675V13.3334C2.5 14.7141 3.61929 15.8334 5 15.8334Z"
              stroke="#646663"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <input
          id={inputId}
          type="email"
          className={['form-control', error ? 'error' : '', className ?? ''].filter(Boolean).join(' ')}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onKeyDown={handleKeyDown}
          {...rest}
        />
      </div>

      {error && (
        <span className="alert error" id={`${inputId}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
