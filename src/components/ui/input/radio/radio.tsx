import { useId, type ComponentPropsWithRef } from 'react';
import '../form.css';
import './radio.css';

/** A single selectable option in a radio group. */
export interface RadioOption {
  label: string;
  /** Rendered as the native input's `value` attribute (reaches forms as a string). */
  value: string | number;
  /** Disable just this option while leaving the rest of the group interactive. */
  disabled?: boolean;
}

export interface LUIRadioProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    'type' | 'value' | 'defaultValue' | 'checked' | 'defaultChecked' | 'children'
  > {
  /** Optional group label rendered above the options. */
  label?: string;
  /** Options to render — one radio per entry. */
  options?: RadioOption[];
  /** Where each option label sits relative to its control. */
  labelPosition?: 'left' | 'right' | 'top';
  /** `inline` lays options out in a row (default); `stacked` in a column. */
  orientation?: 'inline' | 'stacked';
  /** Controlled selected value — pair with `onChange` (`e.target.value` is a string). */
  value?: string | number;
  /** Initially selected value for uncontrolled usage. */
  defaultValue?: string | number;

  /** Render the selected option's label as plain text instead of the radio group. */
  viewMode?: boolean;

  /** Option value resolved and shown in view mode instead of `value`/`defaultValue`. */
  viewValue?: string | number;
}

/**
 * A radio group driven by an `options` array. Renders one native
 * `<input type="radio">` per option sharing the same `name`, and passes
 * `name`, `onChange`, `onBlur` and `ref` through to the native inputs —
 * spreading react-hook-form's `register()` works directly (note: option
 * values reach the form as strings, since they become native `value`
 * attributes).
 */
export function LUIRadio({
  label = '',
  options = [],
  name,
  disabled = false,
  labelPosition = 'right',
  orientation = 'inline',
  value,
  defaultValue,
  viewMode = false,
  viewValue,
  className,
  ...rest
}: LUIRadioProps) {
  const autoName = useId();
  const groupName = name ?? autoName;

  if (viewMode) {
    const selectedValue = viewValue ?? value ?? defaultValue;
    const selected = options.find((option) => option.value === selectedValue);
    return (
      <div
        className={['form-group', 'lui-control-host', 'view-mode', className ?? ''].filter(Boolean).join(' ')}
      >
        {label && <label>{label}</label>}
        <div className="view-value">{selected?.label ?? '-'}</div>
      </div>
    );
  }

  const groupClasses = ['radio-group', orientation === 'stacked' ? 'stacked' : '']
    .filter(Boolean)
    .join(' ');

  const rowClasses = [
    'control-row',
    'radio-control',
    labelPosition === 'left' ? 'label-left' : labelPosition === 'top' ? 'label-top' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={['form-group', 'lui-control-host', className ?? ''].filter(Boolean).join(' ')}
    >
      {label && <label>{label}</label>}

      <div className={groupClasses}>
        {options.map((option) => (
          <label key={String(option.value)} className={rowClasses}>
            <input
              type="radio"
              className="radio-input"
              name={groupName}
              value={option.value}
              disabled={disabled || !!option.disabled}
              {...(value !== undefined
                ? { checked: value === option.value }
                : defaultValue !== undefined
                  ? { defaultChecked: defaultValue === option.value }
                  : {})}
              {...rest}
            />
            <span className="radio-dot" aria-hidden="true"></span>
            <span className="control-label">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
