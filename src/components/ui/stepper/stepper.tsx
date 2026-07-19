import { Fragment, useState } from 'react';
import './stepper.css';

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepStatus = 'completed' | 'active' | 'error' | 'upcoming';

/** A single step in an {@link LUIStepper}. */
export interface Step {
  /** Primary label for the step. */
  title: string;
  /** Optional supporting line under the title. */
  description?: string;
  /**
   * Custom glyph/emoji shown in the indicator instead of the step number.
   * Ignored once the step is completed (checkmark) or in error (alert mark).
   */
  icon?: string;
  /** Mark the step invalid — indicator turns the error color with an alert mark. */
  error?: boolean;
  /** Force the step to read as completed regardless of the active index. */
  completed?: boolean;
  /** Disable this step: dimmed and never selectable. */
  disabled?: boolean;
}

export interface LUIStepperProps {
  /** The ordered steps to render. */
  steps?: readonly Step[];
  /**
   * Index of the current step. Angular `model()` — leave undefined for internal
   * state (click-driven), or pair with `onActiveChange` for controlled usage.
   */
  active?: number;
  orientation?: StepperOrientation;
  /** Show the connecting rails between steps. Steps stay spaced either way. */
  showLines?: boolean;
  /** Allow the user to click a step to jump to it. */
  clickable?: boolean;
  /** When clickable, also allow selecting steps ahead of the active one (skip forward). */
  allowStepSkip?: boolean;
  /** Fires with the new index when the active step changes (controlled-usage half of `active`). */
  onActiveChange?: (index: number) => void;
  /** Fires the target index when a step is selected (only fires when it is selectable). */
  onStepChange?: (index: number) => void;
  className?: string;
}

/** @internal Resolved per-step view model consumed by the markup. */
interface StepView extends Step {
  index: number;
  number: number;
  status: StepStatus;
  selectable: boolean;
}

function resolveStatus(step: Step, index: number, active: number): StepStatus {
  if (step.error) return 'error';
  if (step.completed || index < active) return 'completed';
  if (index === active) return 'active';
  return 'upcoming';
}

const CHECK_ICON = (
  <svg
    className="l-stepper__icon"
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 10.5L8.5 14L15 6.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ERROR_ICON = (
  <svg
    className="l-stepper__icon"
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M10 5.5V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="10" cy="14.5" r="1.1" fill="currentColor" />
  </svg>
);

/**
 * Stepper — a progress indicator for multi-step flows (wizards, checkout, form
 * sequences), styled after Mantine's stepper: the indicator sits inline with a
 * title/description body and connecting rails run between steps.
 *
 * Steps before the active index render a checkmark in the success color; the
 * active step is highlighted; any step flagged `error` (e.g. its form section is
 * invalid) shows an alert mark in the error color. A step's `icon` overrides the
 * number for steps that are neither completed nor in error, otherwise the step
 * number is shown.
 *
 * `active` was a two-way `model` in Angular — drive it from clickable steps
 * (`clickable`) with internal state, *or* from external Next/Back buttons via
 * `active` + `onActiveChange`. `allowStepSkip` gates whether the user may click
 * steps that lie ahead of the current one.
 *
 * ```tsx
 * <LUIStepper steps={steps} clickable active={current} onActiveChange={setCurrent} />
 * <LUIStepper steps={steps} orientation="vertical" active={2} />
 * ```
 */
export function LUIStepper({
  steps = [],
  active: activeProp,
  orientation = 'horizontal',
  showLines = true,
  clickable = false,
  allowStepSkip = false,
  onActiveChange,
  onStepChange,
  className,
}: LUIStepperProps) {
  const [internalActive, setInternalActive] = useState(0);
  const active = activeProp ?? internalActive;

  const stepViews: StepView[] = steps.map((step, index) => ({
    ...step,
    index,
    number: index + 1,
    status: resolveStatus(step, index, active),
    selectable: clickable && !step.disabled && (allowStepSkip || index <= active),
  }));

  const hostClasses = [
    'l-stepper',
    `l-stepper--${orientation}`,
    !showLines ? 'l-stepper--no-lines' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const select = (step: StepView): void => {
    if (!step.selectable || step.index === active) return;
    setInternalActive(step.index);
    onActiveChange?.(step.index);
    onStepChange?.(step.index);
  };

  return (
    <div className={hostClasses}>
      <div className="l-stepper__list" role="list">
        {stepViews.map((step) => {
          const last = step.index === stepViews.length - 1;
          return (
            <Fragment key={step.index}>
              <button
                type="button"
                className={[
                  'l-stepper__step',
                  `is-${step.status}`,
                  step.selectable ? 'is-selectable' : '',
                  step.disabled ? 'is-disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                role="listitem"
                disabled={!step.selectable}
                aria-current={step.status === 'active' ? 'step' : undefined}
                onClick={() => select(step)}
              >
                <span className="l-stepper__indicator-wrap">
                  <span className="l-stepper__indicator">
                    {step.status === 'completed' ? (
                      CHECK_ICON
                    ) : step.status === 'error' ? (
                      ERROR_ICON
                    ) : step.icon ? (
                      <span className="l-stepper__custom-icon" aria-hidden="true">
                        {step.icon}
                      </span>
                    ) : (
                      <span className="l-stepper__number">{step.number}</span>
                    )}
                  </span>

                  {orientation === 'vertical' && !last && (
                    <span
                      className={`l-stepper__connector${step.status === 'completed' ? ' is-done' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                </span>

                <span className="l-stepper__label">
                  <span className="l-stepper__title">{step.title}</span>
                  {step.description && (
                    <span className="l-stepper__description">{step.description}</span>
                  )}
                </span>
              </button>

              {orientation === 'horizontal' && !last && (
                <span
                  className={`l-stepper__connector${step.status === 'completed' ? ' is-done' : ''}`}
                  aria-hidden="true"
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
