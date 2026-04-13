import { RETRY_DEFAULT_DELAY } from "../src/types/index.js";
import { computeDelay } from "../src/core/ComputeDelay.js";
import { describe, it, expect } from "vitest";

describe("computeDelay — exponential (default)", () => {
  it("attempt 1 = base delay", () => {
    expect(computeDelay({ times: 3, delay: 300, jitter: false }, 1)).toBe(300);
  });
  it("attempt 2 = base * 2", () => {
    expect(computeDelay({ times: 3, delay: 300, jitter: false }, 2)).toBe(600);
  });
  it("attempt 3 = base * 4", () => {
    expect(computeDelay({ times: 3, delay: 300, jitter: false }, 3)).toBe(1200);
  });
  it("uses RETRY_DEFAULT_DELAY when not specified", () => {
    expect(computeDelay({ times: 3, jitter: false }, 1)).toBe(
      RETRY_DEFAULT_DELAY,
    );
  });
});

describe("computeDelay — fixed", () => {
  it("returns same delay every attempt", () => {
    const cfg = {
      times: 3,
      delay: 500,
      backoff: "fixed" as const,
      jitter: false,
    };
    expect(computeDelay(cfg, 1)).toBe(500);
    expect(computeDelay(cfg, 2)).toBe(500);
    expect(computeDelay(cfg, 3)).toBe(500);
  });
});

describe("computeDelay — jitter", () => {
  it("applies ±25% jitter by default", () => {
    const results = Array.from({ length: 50 }, () =>
      computeDelay({ times: 3, delay: 300 }, 1),
    );
    expect(Math.min(...results)).toBeGreaterThanOrEqual(300 * 0.75 - 1);
    expect(Math.max(...results)).toBeLessThanOrEqual(300 * 1.25 + 1);
    expect(Math.max(...results) - Math.min(...results)).toBeGreaterThan(0);
  });
  it("jitter: false produces exact values", () => {
    expect(computeDelay({ times: 3, delay: 400, jitter: false }, 2)).toBe(800);
    expect(computeDelay({ times: 3, delay: 400, jitter: false }, 2)).toBe(800);
  });
});
