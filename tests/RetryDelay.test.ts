import { retryDelay } from "../src/core/RetryDelay.js";
import { describe, it, expect, vi } from "vitest";

describe("retryDelay — normal", () => {
  it("resolves after delay", async () => {
    vi.useFakeTimers();
    const p = retryDelay(500);
    vi.advanceTimersByTime(500);
    await expect(p).resolves.toBeUndefined();
    vi.useRealTimers();
  });
  it("does not resolve before delay", async () => {
    vi.useFakeTimers();
    let done = false;
    retryDelay(500).then(() => {
      done = true;
    });
    vi.advanceTimersByTime(499);
    await Promise.resolve();
    expect(done).toBe(false);
    vi.advanceTimersByTime(1);
    await Promise.resolve();
    expect(done).toBe(true);
    vi.useRealTimers();
  });
});

describe("retryDelay — already aborted signal", () => {
  it("rejects immediately", async () => {
    const c = new AbortController();
    c.abort();
    await expect(retryDelay(5000, c.signal)).rejects.toThrow("Aborted");
  });
});

describe("retryDelay — signal fires during delay", () => {
  it("rejects when signal fires before delay", async () => {
    vi.useFakeTimers();
    const c = new AbortController();
    const p = retryDelay(5000, c.signal);
    vi.advanceTimersByTime(100);
    c.abort();
    await expect(p).rejects.toThrow("Aborted");
    vi.useRealTimers();
  });
  it("rejects even if timer would have fired after abort", async () => {
    vi.useFakeTimers();
    const c = new AbortController();
    const p = retryDelay(500, c.signal).catch((e) => e);
    c.abort();
    vi.advanceTimersByTime(1000);
    const r = await p;
    expect(r).toBeInstanceOf(DOMException);
    expect((r as DOMException).name).toBe("AbortError");
    vi.useRealTimers();
  });
});
