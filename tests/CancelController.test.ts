import { CancelController } from "../src/core/CancelController.js";
import { CosrxError } from "../src/types/index.js";
import { describe, it, expect } from "vitest";

describe("CancelController — initial state", () => {
  it("starts not cancelled", () => {
    expect(new CancelController().isCancelled).toBe(false);
  });
  it("exposes AbortSignal", () => {
    expect(new CancelController().signal).toBeInstanceOf(AbortSignal);
  });
  it("reason is undefined before cancel", () => {
    expect(new CancelController().reason).toBeUndefined();
  });
});

describe("CancelController — cancel()", () => {
  it("sets isCancelled", () => {
    const c = new CancelController();
    c.cancel();
    expect(c.isCancelled).toBe(true);
  });
  it("aborts signal", () => {
    const c = new CancelController();
    c.cancel();
    expect(c.signal.aborted).toBe(true);
  });
  it("stores reason", () => {
    const c = new CancelController();
    c.cancel("nav");
    expect(c.reason).toBe("nav");
  });
  it("is idempotent — first reason preserved", () => {
    const c = new CancelController();
    c.cancel("first");
    c.cancel("second");
    expect(c.reason).toBe("first");
  });
  it("works without reason", () => {
    const c = new CancelController();
    c.cancel();
    expect(c.reason).toBeUndefined();
    expect(c.isCancelled).toBe(true);
  });
});

describe("CancelController.isCancelError()", () => {
  it("true for CosrxError with 'Request aborted' message", () => {
    expect(
      CancelController.isCancelError(
        new CosrxError("Request aborted", null, {}),
      ),
    ).toBe(true);
  });
  it("false for CosrxError with different message", () => {
    expect(
      CancelController.isCancelError(new CosrxError("fail", null, {})),
    ).toBe(false);
  });
  it("false for plain Error", () => {
    expect(CancelController.isCancelError(new Error("x"))).toBe(false);
  });
  it("false for null", () => {
    expect(CancelController.isCancelError(null)).toBe(false);
  });
  it("false for number", () => {
    expect(CancelController.isCancelError(42)).toBe(false);
  });
  it("false for string", () => {
    expect(CancelController.isCancelError("x")).toBe(false);
  });
});
