export class CancelController {
  private _reason: string | undefined;
  private readonly controller: AbortController;
  constructor() {
    this.controller = new AbortController();
  }

  get signal(): AbortSignal {
    return this.controller.signal;
  }
  get isCancelled(): boolean {
    return this.controller.signal.aborted;
  }

  get reason(): string | undefined {
    return this._reason;
  }

  cancel(reason?: string) {
    if (this.isCancelled) return;
    this._reason = reason;
    this.controller.abort();
  }
  static isCancelError(err: unknown): boolean {
    if (err instanceof Error && err.name === "CosrxError") {
      return err.message === "Request aborted";
    }
    return false;
  }
}
