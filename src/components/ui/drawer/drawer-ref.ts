import type { DrawerConfig } from './drawer.config';

/**
 * Handle to an opened drawer, returned by `useLUIDrawer().open()`.
 * Mirrors `ModalRef` — close / afterClosed.
 */
export class DrawerRef<R = unknown> {
  /** Configuration the drawer was opened with (defaults merged in). */
  readonly config: DrawerConfig;

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

  constructor(config: DrawerConfig) {
    this.config = config;
    this._startClose = () => this._finishClose();
    this._closed = new Promise<R | undefined>((resolve) => {
      this._resolveClosed = resolve;
    });
  }

  /** Begin closing the drawer. The result is delivered by `afterClosed()` once the leave animation finishes. */
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

  /** Resolves with the result once the drawer has fully closed. */
  afterClosed(): Promise<R | undefined> {
    return this._closed;
  }
}
