import type { ComponentPropsWithRef } from 'react';
import '../form.css';
import './toggle.css';

export interface LUIToggleProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> {
  /** Label rendered beside the switch. */
  label?: string;
  /** Where the label sits relative to the control. */
  labelPosition?: 'left' | 'right' | 'top';

  /** Render the state as plain "Yes"/"No" text (from `checked`/`defaultChecked`) instead of the switch. */
  viewMode?: boolean;

  /** State shown in view mode instead of `checked`/`defaultChecked`. */
  viewValue?: boolean;
}

/**
 * A boolean switch built on the shared slider styles. Wraps a native
 * `<input type="checkbox">`, so `checked`/`defaultChecked`, `name`, `onChange`,
 * `onBlur`, `ref`, … all pass through — spreading react-hook-form's
 * `register()` works directly.
 */
export function LUIToggle({
  label = '',
  labelPosition = 'right',
  viewMode = false,
  viewValue,
  className,
  ...rest
}: LUIToggleProps) {
  if (viewMode) {
    return (
      <div className="form-group lui-control-host view-mode">
        {label && <label>{label}</label>}
        <div className="view-value">{(viewValue ?? rest.checked ?? rest.defaultChecked) ? 'Yes' : 'No'}</div>
      </div>
    );
  }

  const rowClasses = [
    'control-row',
    labelPosition === 'left' ? 'label-left' : labelPosition === 'top' ? 'label-top' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="form-group lui-control-host">
      <label className={rowClasses}>
        <span className="switch">
          <input type="checkbox" {...rest} />
          <span className="slider round"></span>
        </span>

        {label && <span className="control-label">{label}</span>}
      </label>
    </div>
  );
}
