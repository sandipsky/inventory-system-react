import type { ComponentPropsWithRef } from 'react';
import '../form.css';
import './toggle.css';

export interface LUIToggleProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> {
  /** Label rendered beside the switch. */
  label?: string;
  /** Which side of the control the label sits on. */
  labelPosition?: 'left' | 'right';
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
  className,
  ...rest
}: LUIToggleProps) {
  const rowClasses = [
    'control-row',
    labelPosition === 'left' ? 'label-left' : '',
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
