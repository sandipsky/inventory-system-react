import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ModalContainer } from './modal-container';
import { ModalRef } from './modal-ref';
import { MODAL_DEFAULTS, type ModalConfig } from './modal.config';

/**
 * Modal content — plain JSX, or a render function that receives the
 * `ModalRef` so the content can close its own modal (and read
 * `ref.config.data`).
 */
export type ModalContent<R = unknown> = ReactNode | ((ref: ModalRef<R>) => ReactNode);

/** Imperative modal API returned by `useLUIModal()`. */
export interface LUIModalApi {
  /**
   * Open a modal with the given content; returns a `ModalRef` handle
   * (close / afterClosed).
   */
  open<R = unknown, D = unknown>(content: ModalContent<R>, config?: ModalConfig<D>): ModalRef<R>;

  /** Close every open modal. */
  closeAll(): void;
}

interface OpenModal {
  key: number;
  content: ModalContent;
  modalRef: ModalRef;
}

const ModalContext = createContext<LUIModalApi | null>(null);

let _uid = 0;

/**
 * React counterpart of the Angular `ModalService` — a Material-`MatDialog`-style
 * imperative modal host.
 *
 * Mount once near the app root; call `useLUIModal()` anywhere below it.
 * Containers render into `document.body` via `createPortal`, play pure-CSS
 * enter/leave animations selected via `config.animation`, and body scroll is
 * locked while any modal is open.
 */
export function LUIModalProvider({ children }: { children?: ReactNode }) {
  const [modals, setModals] = useState<OpenModal[]>([]);
  const live = useRef<OpenModal[]>([]);

  function open<R = unknown, D = unknown>(
    content: ModalContent<R>,
    config: ModalConfig<D> = {},
  ): ModalRef<R> {
    const merged: ModalConfig<D> = { ...MODAL_DEFAULTS, ...config };
    const modalRef = new ModalRef<R>(merged);
    const item: OpenModal = { key: _uid++, content: content as ModalContent, modalRef: modalRef as unknown as ModalRef };

    live.current = [...live.current, item];
    setModals(live.current);

    void modalRef.afterClosed().then(() => {
      live.current = live.current.filter((m) => m !== item);
      setModals(live.current);
    });

    return modalRef;
  }

  function closeAll(): void {
    [...live.current].forEach((m) => m.modalRef.close());
  }

  const api: LUIModalApi = { open, closeAll };

  const anyOpen = modals.length > 0;
  useEffect(() => {
    if (!anyOpen) {
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [anyOpen]);

  return (
    <ModalContext.Provider value={api}>
      {children}
      {modals.map((m) =>
        createPortal(
          <ModalContainer modalRef={m.modalRef}>
            {typeof m.content === 'function' ? m.content(m.modalRef) : m.content}
          </ModalContainer>,
          document.body,
          `lui-modal-${m.key}`,
        ),
      )}
    </ModalContext.Provider>
  );
}

/** Access the imperative modal API. Must be used below `LUIModalProvider`. */
export function useLUIModal(): LUIModalApi {
  const api = useContext(ModalContext);
  if (!api) {
    throw new Error('useLUIModal() must be used within an <LUIModalProvider>.');
  }
  return api;
}
