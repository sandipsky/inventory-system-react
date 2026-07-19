import { createContext, useRef, useState, type ReactNode } from 'react';
import './accordion.css';

export type AccordionVariant = 'contained' | 'separated';

/** @internal Registration handle an item hands to its parent accordion. */
export interface AccordionItemHandle {
  id: string;
  /** Read lazily so the accordion always sees the item's current disabled state. */
  readonly disabled: boolean;
  focus: () => void;
}

/**
 * @internal Accordion-wide flags and state accessors owned by
 * {@link LUIAccordion}, read by every {@link LUIAccordionItem}.
 */
export interface AccordionContextValue {
  variant: AccordionVariant;
  iconPosition: 'left' | 'right';
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
  moveFocus: (fromId: string, key: string) => void;
  register: (handle: AccordionItemHandle, expanded: boolean) => void;
  unregister: (id: string) => void;
}

export const AccordionContext = createContext<AccordionContextValue | null>(null);

export interface LUIAccordionProps {
  /** Allow more than one panel to be open simultaneously. Default: single-open. */
  multiple?: boolean;
  /** `contained` (one bordered list with dividers) or `separated` (spaced cards). */
  variant?: AccordionVariant;
  /** Which side the chevron sits on. Default: 'right'. */
  iconPosition?: 'left' | 'right';
  className?: string;
  children?: ReactNode;
}

/**
 * Container for a stack of collapsible {@link LUIAccordionItem}s. Owns the open
 * state — `multiple` decides whether several panels can stay open at once or
 * opening one collapses the rest — and the roving-focus keyboard navigation
 * across the item headers.
 *
 * ```tsx
 * <LUIAccordion multiple>
 *   <LUIAccordionItem title="Section one">…</LUIAccordionItem>
 *   <LUIAccordionItem title="Section two">…</LUIAccordionItem>
 * </LUIAccordion>
 * ```
 */
export function LUIAccordion({
  multiple = false,
  variant = 'contained',
  iconPosition = 'right',
  className,
  children,
}: LUIAccordionProps) {
  /** Registered items, in DOM order. */
  const itemsRef = useRef<AccordionItemHandle[]>([]);
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());

  /** Called by an item on mount (in DOM order). */
  const register = (handle: AccordionItemHandle, expanded: boolean): void => {
    itemsRef.current = [...itemsRef.current, handle];
    if (expanded) {
      setOpenIds((prev) => {
        const next = new Set<string>(multiple ? prev : []);
        next.add(handle.id);
        return next;
      });
    }
  };

  /** Called by an item on unmount. */
  const unregister = (id: string): void => {
    itemsRef.current = itemsRef.current.filter((h) => h.id !== id);
    setOpenIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  /** Toggle an item, honoring single/multiple mode. */
  const toggle = (id: string): void => {
    const item = itemsRef.current.find((h) => h.id === id);
    if (!item || item.disabled) return;
    setOpenIds((prev) => {
      const isOpen = prev.has(id);
      const next = new Set<string>(multiple ? prev : []);
      if (multiple && isOpen) {
        next.delete(id);
      } else if (!isOpen) {
        next.add(id);
      }
      return next;
    });
  };

  /** Roving focus across enabled headers (Arrow/Home/End). */
  const moveFocus = (fromId: string, key: string): void => {
    const items = itemsRef.current.filter((h) => !h.disabled);
    if (!items.length) return;
    const index = items.findIndex((h) => h.id === fromId);
    let target: AccordionItemHandle | undefined;
    switch (key) {
      case 'ArrowDown':
        target = items[(index + 1) % items.length];
        break;
      case 'ArrowUp':
        target = items[(index - 1 + items.length) % items.length];
        break;
      case 'Home':
        target = items[0];
        break;
      case 'End':
        target = items[items.length - 1];
        break;
    }
    target?.focus();
  };

  const context: AccordionContextValue = {
    variant,
    iconPosition,
    isOpen: (id) => openIds.has(id),
    toggle,
    moveFocus,
    register,
    unregister,
  };

  return (
    <div
      className={['l-accordion', `l-accordion--${variant}`, className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      <AccordionContext value={context}>{children}</AccordionContext>
    </div>
  );
}
