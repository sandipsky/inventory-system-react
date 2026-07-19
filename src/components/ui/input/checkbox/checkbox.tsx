import type { ComponentPropsWithRef } from 'react';
import './checkbox.css';

export interface LUICheckboxProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> {
  /** Label rendered beside the box. */
  label?: string;
  /** Which side of the control the label sits on. */
  labelPosition?: 'left' | 'right';
}

/**
 * A custom-styled boolean checkbox. Wraps a native `<input type="checkbox">`,
 * so `checked`/`defaultChecked`, `name`, `onChange`, `onBlur`, `ref`, … all
 * pass through — spreading react-hook-form's `register()` works directly.
 */
export function LUICheckbox({
  label = '',
  labelPosition = 'right',
  className,
  ...rest
}: LUICheckboxProps) {
  const rowClasses = [
    'control-row',
    'checkbox-control',
    labelPosition === 'left' ? 'label-left' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="form-group lui-control-host">
      <label className={rowClasses}>
        <input type="checkbox" className="check-input" {...rest} />
        <span className="check-box" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3.5 8.5L6.5 11.5L12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        {label && <span className="control-label">{label}</span>}
      </label>
    </div>
  );
}
