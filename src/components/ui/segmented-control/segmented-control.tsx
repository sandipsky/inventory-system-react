import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from 'react';
import './segmented-control.css';

export type SegmentedOrientation = 'horizontal' | 'vertical';
export type SegmentedSize = 'sm' | 'md' | 'lg';

export interface SegmentedOption {
  label: string;
  value: unknown;
  disabled?: boolean;
}

export interface LUISegmentedControlProps {
  /** Options to choose from — plain strings or `{ label, value, disabled }` objects. */
  options?: readonly (string | SegmentedOption)[];
  orientation?: SegmentedOrientation;
  size?: SegmentedSize;
  /** Disable the whole control. */
  disabled?: boolean;
  /** Stretch to the container width with equal-width segments. */
  fullWidth?: boolean;
  /** The selected value (controlled — pair with `onChange`). */
  value?: unknown;
  /** Called with the selected value when it changes. */
  onChange?: (value: unknown) => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

interface ThumbRect {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

/**
 * Segmented control — a single-select switch rendered as a row (or column) of
 * connected buttons, like iOS / Ant Design `Segmented`. Accepts plain strings
 * or `{ label, value, disabled }` objects, works as a controlled component
 * (`value` + `onChange`), and follows the WAI-ARIA radio-group keyboard
 * pattern.
 *
 * ```tsx
 * <LUISegmentedControl options={['Daily', 'Weekly', 'Monthly']} value={range} onChange={(v) => setRange(v as string)} />
 * <LUISegmentedControl options={opts} orientation="vertical" value={view} onChange={(v) => setView(v as string)} />
 * ```
 */
export function LUISegmentedControl({
  options = [],
  orientation = 'horizontal',
  size = 'md',
  disabled = false,
  fullWidth = false,
  value = null,
  onChange,
  className,
  ref,
}: LUISegmentedControlProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /** Geometry of the sliding thumb behind the selected segment. */
  const [thumb, setThumb] = useState<ThumbRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });
  /** Gate the slide transition on until after the first paint (avoid a flash from 0,0). */
  const [ready, setReady] = useState(false);
  /** Bumped by the ResizeObserver so the thumb re-places on layout changes
      (the positioning layout effect runs on every render). */
  const [, setResizeTick] = useState(0);

  const normalizedOptions: SegmentedOption[] = options.map((option) =>
    option !== null && typeof option === 'object'
      ? { label: option.label, value: option.value, disabled: !!option.disabled }
      : { label: String(option), value: option, disabled: false },
  );

  /** The single segment that is keyboard-tabbable (the selected one, else the first enabled). */
  const selected = normalizedOptions.find((o) => o.value === value && !o.disabled);
  const tabbableValue = (selected ?? normalizedOptions.find((o) => !o.disabled))?.value;

  /* Re-place the thumb whenever the selection, options or layout change. */
  useLayoutEffect(() => {
    const index = normalizedOptions.findIndex((o) => o.value === value && !o.disabled);
    const segment = segmentRefs.current[index];
    if (index < 0 || !segment) {
      setThumb((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    const next: ThumbRect = {
      x: segment.offsetLeft,
      y: segment.offsetTop,
      width: segment.offsetWidth,
      height: segment.offsetHeight,
      visible: true,
    };
    setThumb((prev) =>
      prev.x === next.x &&
      prev.y === next.y &&
      prev.width === next.width &&
      prev.height === next.height &&
      prev.visible === next.visible
        ? prev
        : next,
    );
  });

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    const host = hostRef.current;
    const observer = new ResizeObserver(() => setResizeTick((tick) => tick + 1));
    if (host) observer.observe(host);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  const isSelected = (optionValue: unknown): boolean => value === optionValue;

  const select = (option: SegmentedOption): void => {
    if (disabled || option.disabled || value === option.value) return;
    onChange?.(option.value);
  };

  const nextEnabled = (from: number, direction: number): number => {
    const count = normalizedOptions.length;
    for (let step = 1; step <= count; step++) {
      const index = (from + direction * step + count * 2) % count;
      if (!normalizedOptions[index].disabled) return index;
    }
    return -1;
  };

  const onKeydown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const horizontal = orientation === 'horizontal';
    let target: number;
    switch (event.key) {
      case horizontal ? 'ArrowRight' : 'ArrowDown':
        target = nextEnabled(index, 1);
        break;
      case horizontal ? 'ArrowLeft' : 'ArrowUp':
        target = nextEnabled(index, -1);
        break;
      case 'Home':
        target = nextEnabled(-1, 1);
        break;
      case 'End':
        target = nextEnabled(normalizedOptions.length, -1);
        break;
      default:
        return;
    }
    if (target < 0) return;
    event.preventDefault();
    select(normalizedOptions[target]);
    segmentRefs.current[target]?.focus();
  };

  const hostClasses = [
    'l-segmented',
    `l-segmented--${orientation}`,
    `l-segmented--${size}`,
    fullWidth ? 'l-segmented--full' : '',
    disabled ? 'is-disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={(el) => {
        hostRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      className={hostClasses}
      role="radiogroup"
      aria-orientation={orientation}
      aria-disabled={disabled || undefined}
    >
      {thumb.visible && (
        <span
          className={`l-segmented__thumb${ready ? ' is-ready' : ''}`}
          style={{
            width: `${thumb.width}px`,
            height: `${thumb.height}px`,
            transform: `translate(${thumb.x}px, ${thumb.y}px)`,
          }}
        />
      )}

      {normalizedOptions.map((option, i) => (
        <button
          key={i}
          ref={(el) => {
            segmentRefs.current[i] = el;
          }}
          type="button"
          role="radio"
          className={`l-segmented__item${isSelected(option.value) ? ' is-selected' : ''}`}
          aria-checked={isSelected(option.value)}
          aria-label={option.label}
          tabIndex={option.value === tabbableValue ? 0 : -1}
          disabled={disabled || option.disabled}
          onClick={() => select(option)}
          onKeyDown={(event) => onKeydown(event, i)}
        >
          <span className="l-segmented__label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
