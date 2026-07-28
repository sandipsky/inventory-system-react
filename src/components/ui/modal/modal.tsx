import type { ComponentPropsWithRef, ReactNode } from 'react';
import { LUIButton } from '../button/button';
import './modal.css';

export interface LUIModalProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Header title. Adding it (or `subTitle` / `onClose`) shows the header. */
  title?: ReactNode;

  /** Secondary line rendered under the title. */
  subTitle?: ReactNode;

  /**
   * Renders the header close button and is called when it is pressed —
   * wire it to `modalRef.close()`.
   */
  onClose?: () => void;

  /** Accessible label for the close button. */
  closeLabel?: string;

  /** Footer content (usually action buttons), right-aligned above a top divider. */
  footer?: ReactNode;
}

/**
 * Standard modal content layout — header (title / sub-title / close button),
 * scrollable body and action footer — for panels opened via `useLUIModal()`,
 * which also accepts any custom JSX in place of this template:
 *
 * ```tsx
 * modal.open((ref) => (
 *   <LUIModal
 *     title="Edit profile"
 *     subTitle="Changes apply immediately"
 *     onClose={() => ref.close()}
 *     footer={<LUIButton onClick={() => ref.close(true)}>Save</LUIButton>}
 *   >
 *     Body content.
 *   </LUIModal>
 * ));
 * ```
 */
export function LUIModal({
  title,
  subTitle,
  onClose,
  closeLabel = 'Close',
  footer,
  className,
  children,
  ...rest
}: LUIModalProps) {
  const hasHeader = title != null || subTitle != null || onClose != null;

  const classes = ['modal', className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {hasHeader && (
        <div className="modal-header">
          <div className="modal-title-group">
            {title != null && <h2 className="modal-title">{title}</h2>}
            {subTitle != null && <p className="modal-sub-title">{subTitle}</p>}
          </div>
          {onClose && (
            <div className="close-btn">
              <LUIButton variant="ghost" rounded onClick={onClose} aria-label={closeLabel}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15 5 5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </LUIButton>
            </div>
          )}
        </div>
      )}

      <div className="modal-body">
        <div className="modal-content">{children}</div>
      </div>

      {footer != null && <div className="modal-footer">{footer}</div>}
    </div>
  );
}
