import { useId, type ComponentPropsWithRef, type KeyboardEvent } from 'react';
import '../form.css';
import './textarea.css';

export interface LUITextareaProps extends ComponentPropsWithRef<'textarea'> {
  /** Label rendered above the field, linked to the textarea. */
  label?: string;

  /** Validation message shown under the field; also applies the error style. */
  error?: string;

  /** Show the drag-to-resize handle (vertical only). Off by default. */
  resizable?: boolean;

  /** Called when Enter is pressed in the field (a newline is still inserted). */
  onEnter?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;

  /** Render the value as plain text (line breaks preserved) instead of the textarea. */
  viewMode?: boolean;

  /** Shown in view mode instead of `value`/`defaultValue`. */
  viewValue?: string | number;
}

/**
 * Multi-line text field. Works uncontrolled with react-hook-form's
 * `register()` spread and as a plain controlled component — all native
 * textarea props (`name`, `value`/`defaultValue`, `onChange`, `onBlur`,
 * `ref`, `rows`, …) pass through.
 */
export function LUITextarea({
  label,
  error,
  resizable = false,
  onEnter,
  onKeyDown,
  id,
  rows = 4,
  required,
  viewMode = false,
  viewValue,
  className,
  ...rest
}: LUITextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;

  if (viewMode) {
    return (
      <div className="form-group lui-field view-mode">
        {label && <label>{label}</label>}
        <div className="view-value pre-wrap">{String(viewValue ?? rest.value ?? rest.defaultValue ?? '') || '-'}</div>
      </div>
    );
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.key === 'Enter') onEnter?.(event);
  };

  return (
    <div className="form-group lui-field">
      {label && (
        <label htmlFor={textareaId}>
          {label}
          {required && <span> *</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        className={['form-control', resizable ? 'resizable' : '', error ? 'error' : '', className ?? '']
          .filter(Boolean)
          .join(' ')}
        required={required}
        onKeyDown={handleKeyDown}
        {...rest}
      ></textarea>

      {error && <div className="alert error">{error}</div>}
    </div>
  );
}
