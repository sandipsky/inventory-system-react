import { useState } from 'react';
import { LUIButton } from '../button/button';
import type { ModalRef } from './modal-ref';
import './confirm-dialog.css';

export interface ConfirmDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Variant of the confirm button — `danger` for destructive actions. */
  confirmVariant?: 'primary' | 'danger';
  /**
   * Optional async action run when the user confirms. The dialog shows a
   * loading state while it runs and only closes (with `true`) when it
   * succeeds — on rejection the dialog stays open so the user can retry.
   * If omitted, confirming simply closes with `true`.
   */
  onConfirm?: () => Promise<unknown>;
}

export interface LUIConfirmDialogProps {
  data?: ConfirmDialogData;
  /** Ref of the modal this dialog was opened in — used to close itself. */
  modalRef: ModalRef<boolean>;
}

/**
 * Example of opening a dedicated component (rather than inline JSX) in the
 * modal. Receives its data and the `ModalRef` as props and closes itself,
 * resolving `true`/`false` through `afterClosed()`.
 */
export function LUIConfirmDialog({ data = {}, modalRef }: LUIConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const confirm = () => {
    if (loading) {
      return;
    }

    // No async action supplied — behave like a plain confirm.
    if (!data.onConfirm) {
      modalRef.close(true);
      return;
    }

    // Block the modal from closing until the action resolves.
    modalRef.setDisableClose(true);
    setLoading(true);

    data.onConfirm().then(
      () => {
        modalRef.setDisableClose(false);
        modalRef.close(true);
      },
      () => {
        // Keep the dialog open so the user can retry.
        setLoading(false);
        modalRef.setDisableClose(false);
      },
    );
  };

  return (
    <div className="confirm-dialog">
      <h2 className="confirm-dialog__title">{data.title || 'Confirm'}</h2>
      <p className="confirm-dialog__message">{data.message || 'Are you sure?'}</p>

      <div className="confirm-dialog__actions">
        <LUIButton variant="outlined" disabled={loading} onClick={() => modalRef.close(false)}>
          {data.cancelText || 'Cancel'}
        </LUIButton>
        <LUIButton variant={data.confirmVariant || 'danger'} disabled={loading} onClick={confirm}>
          {loading ? 'Working…' : data.confirmText || 'Delete'}
        </LUIButton>
      </div>
    </div>
  );
}
