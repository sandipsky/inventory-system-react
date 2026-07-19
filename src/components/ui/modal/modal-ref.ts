import type { ModalConfig } from './modal.config';

/**
 * Handle to an opened modal, returned by `useLUIModal().open()`.
 * Analogous to Angular Material's `MatDialogRef`.
 */
export class ModalRef<R = unknown> {
  /** Configuration the modal was opened with (defaults merged in). */
  readonly config: ModalConfig;

  /** @internal Set by the container — kicks off the leave animation. */
  _startClose: () => void;

  /** @internal Called by the container to take over the leave animation. */
  _setStartClose(fn: () => void): void {
    this._startClose = fn;
  }

  private _resolveClosed!: (result: R | undefined) => void;
  private readonly _closed: Promise<R | undefined>;
  private _result?: R;
  private _closing = false;
  private _finished = false;

  constructor(config: ModalConfig) {
    this.config = config;
    this._startClose = () => this._finishClose();
    this._closed = new Promise<R | undefined>((resolve) => {
      this._resolveClosed = resolve;
    });
  }

  /** Begin closing the modal. The result is delivered by `afterClosed()` once the leave animation finishes. */
  close(result?: R): void {
    if (this._closing) {
      return;
    }
    this._closing = true;
    this._result = result;
    this._startClose();
  }

  /** @internal Called by the container once the leave animation has completed. */
  _finishClose(): void {
    if (this._finished) {
      return;
    }
    this._finished = true;
    this._resolveClosed(this._result);
  }

  /** Toggle `config.disableClose`, e.g. to block closing while an action is pending. */
  setDisableClose(disabled: boolean): void {
    this.config.disableClose = disabled;
  }

  /** Resolves with the result once the modal has fully closed. */
  afterClosed(): Promise<R | undefined> {
    return this._closed;
  }
}
