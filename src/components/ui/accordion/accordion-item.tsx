import {
  use,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { AccordionContext, type AccordionItemHandle } from './accordion';
import './accordion-item.css';

export interface LUIAccordionItemProps {
  /**
   * Header content. Accepts rich markup — a `ReactNode` here is the React
   * counterpart of the Angular `title` slot.
   */
  title?: ReactNode;
  /** Disable toggling; the header is skipped by keyboard navigation. */
  disabled?: boolean;
  /** Whether this item starts open (applied once, when it registers with the accordion). */
  expanded?: boolean;
  /** Id for the header/panel pair; auto-generated when omitted. */
  id?: string;
  /** Called with the new open state whenever this item expands or collapses. */
  onOpenedChange?: (open: boolean) => void;
  children?: ReactNode;
}

/**
 * A single collapsible section inside an {@link LUIAccordion}. Renders a header
 * button and a panel whose content is `children`. Open state is owned by the
 * parent accordion; this component only reflects it.
 */
export function LUIAccordionItem({
  title = '',
  disabled = false,
  expanded = false,
  id,
  onOpenedChange,
  children,
}: LUIAccordionItemProps) {
  const accordion = use(AccordionContext);
  if (!accordion) {
    throw new Error('LUIAccordionItem must be rendered inside LUIAccordion');
  }

  const autoId = useId();
  const itemId = id ?? `l-accordion-item-${autoId}`;
  const triggerId = `${itemId}-trigger`;
  const panelId = `${itemId}-panel`;

  const headerRef = useRef<HTMLButtonElement>(null);

  /* The registered handle reads `disabled` lazily so the accordion always sees
     the current value without re-registering (which would reorder the items). */
  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  });

  /* Register with the parent accordion. useLayoutEffect so an `expanded` item
     opens before first paint instead of animating open on mount. `expanded` is
     intentionally read once, at registration — as in the Angular source. */
  useLayoutEffect(() => {
    const handle: AccordionItemHandle = {
      id: itemId,
      get disabled() {
        return disabledRef.current;
      },
      focus: () => headerRef.current?.focus(),
    };
    accordion.register(handle, expanded);
    return () => accordion.unregister(itemId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const open = accordion.isOpen(itemId);

  /* Emit only on real open/closed transitions, skipping the initial state. */
  const prevOpenRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevOpenRef.current !== null && prevOpenRef.current !== open) {
      onOpenedChange?.(open);
    }
    prevOpenRef.current = open;
  });

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      accordion.moveFocus(itemId, event.key);
    }
  };

  return (
    <div className={`l-accordion-item l-accordion-item--${accordion.variant}`}>
      <h3 className="l-accordion-item__heading">
        <button
          ref={headerRef}
          type="button"
          className={[
            'l-accordion-item__trigger',
            accordion.iconPosition === 'left' ? 'icon-left' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={disabled}
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => accordion.toggle(itemId)}
          onKeyDown={onKeyDown}
        >
          <span className="l-accordion-item__title">{title}</span>

          <svg
            className="l-accordion-item__chevron"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </h3>

      <div
        className={['l-accordion-item__panel', open ? 'is-open' : ''].filter(Boolean).join(' ')}
        role="region"
        id={panelId}
        aria-labelledby={triggerId}
        inert={!open}
      >
        <div className="l-accordion-item__panel-inner">
          <div className="l-accordion-item__content">{children}</div>
        </div>
      </div>
    </div>
  );
}
