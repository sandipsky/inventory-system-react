import { useId, type ComponentPropsWithRef, type KeyboardEvent } from 'react';
import '../form.css';

export interface LUITextInputProps extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'type'> {
  /** Label rendered above the field, linked to the input. */
  label?: string;

  /** Validation message shown under the field; also applies the error style. */
  error?: string;

  /** Called when Enter is pressed in the field. */
  onEnter?: (event: KeyboardEvent<HTMLInputElement>) => void;

  /** Render the value as plain text (from `value`/`defaultValue`) instead of the input. */
  viewMode?: boolean;

  /** Shown in view mode instead of `value`/`defaultValue`. */
  viewValue?: string | number;
}

/**
 * Single-line text field. Works uncontrolled with react-hook-form's
 * `register()` spread and as a plain controlled component — all native input
 * props (`name`, `value`/`defaultValue`, `onChange`, `onBlur`, `ref`, …) pass
 * through.
 */
export function LUITextInput({
  label,
  error,
  onEnter,
  onKeyDown,
  id,
  required,
  viewMode = false,
  viewValue,
  className,
  ...rest
}: LUITextInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  if (viewMode) {
    return (
      <div className="form-group lui-field view-mode">
        {label && <label>{label}</label>}
        <div className="view-value">{String(viewValue ?? rest.value ?? rest.defaultValue ?? '') || '-'}</div>
      </div>
    );
  }

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

      <input
        id={inputId}
        type="text"
        className={['form-control', error ? 'error' : '', className ?? ''].filter(Boolean).join(' ')}
        required={required}
        onKeyDown={handleKeyDown}
        {...rest}
      />

      {error && <div className="alert error">{error}</div>}
    </div>
  );
}
