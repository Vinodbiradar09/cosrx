import type { InterceptorHandler } from "../types/index.js";
export class Interceptors<T> {
  public handlers: (InterceptorHandler<T> | null)[] = [];

  use(
    fulfilled: (value: T) => T | Promise<T>,
    rejected?: ((error: unknown) => unknown) | undefined,
  ): number {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1;
  }

  eject(idx: number): void {
    if (this.handlers[idx]) {
      this.handlers[idx] = null;
    }
  }

  clear(): void {
    this.handlers = [];
  }
}
