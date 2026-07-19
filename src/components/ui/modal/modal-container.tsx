import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { ModalRef } from './modal-ref';
import './modal-container.css';

type ModalState = 'enter' | 'leave';

export interface ModalContainerProps {
  modalRef: ModalRef;
  children?: ReactNode;
}

/**
 * Host component rendered into `<body>` (via `createPortal`) by
 * `LUIModalProvider`. Owns the backdrop, the centered panel, the pure-CSS
 * enter/leave animations, and renders the supplied content.
 */
export function ModalContainer({ modalRef, children }: ModalContainerProps) {
  const [state, setState] = useState<ModalState>('enter');
  const config = modalRef.config;

  useEffect(() => {
    // Let the container drive the leave animation when close() is called.
    modalRef._setStartClose(() => {
      setState('leave');
      // 'none' has no keyframes, so animationend never fires — finish immediately.
      if (modalRef.config.animation === 'none') {
        modalRef._finishClose();
      }
    });
  }, [modalRef]);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !modalRef.config.disableClose) {
        modalRef.close();
      }
    };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [modalRef]);

  const onBackdropClick = () => {
    if (!modalRef.config.disableClose) {
      modalRef.close();
    }
  };

  const anim = config.animation ?? 'slideUp';
  const extra = config.panelClass
    ? Array.isArray(config.panelClass)
      ? config.panelClass
      : [config.panelClass]
    : [];
  const panelClasses = ['modal-panel', `modal-anim-${anim}`, `modal-anim--${state}`, ...extra].join(
    ' ',
  );

  return (
    <div
      className={state === 'leave' ? 'modal-overlay modal-overlay--leaving' : 'modal-overlay'}
      style={{ '--modal-duration': `${config.animationDuration ?? 250}ms` } as CSSProperties}
    >
      {config.backdrop !== false && <div className="modal-backdrop" onClick={onBackdropClick} />}

      <div className="modal-scroll" onClick={onBackdropClick}>
        <div
          className={panelClasses}
          style={{ width: config.width, height: config.height, maxWidth: config.maxWidth }}
          onClick={(event) => event.stopPropagation()}
          onAnimationEnd={(event) => {
            // Only react to the panel's own animation, and only on the way out.
            if (event.target === event.currentTarget && state === 'leave') {
              modalRef._finishClose();
            }
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
