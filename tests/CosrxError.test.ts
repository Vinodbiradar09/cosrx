import { CosrxError, isCosrxError } from "../src/types/index.js";
import { describe, it, expect } from "vitest";

function res(status: number) {
  return {
    data: null,
    status,
    statusText: "err",
    headers: new Headers(),
    config: {},
    rawResponse: new Response(),
  };
}

describe("CosrxError — construction", () => {
  it("sets message", () => {
    expect(new CosrxError("fail", null, {}).message).toBe("fail");
  });
  it("name is CosrxError", () => {
    expect(new CosrxError("fail", null, {}).name).toBe("CosrxError");
  });
  it("is instanceof Error", () => {
    expect(new CosrxError("fail", null, {})).toBeInstanceOf(Error);
  });
  it("is instanceof CosrxError", () => {
    expect(new CosrxError("fail", null, {})).toBeInstanceOf(CosrxError);
  });
  it("instanceof works across prototype chain", () => {
    function check() {
      try {
        throw new CosrxError("x", null, {});
      } catch (e) {
        return e instanceof CosrxError;
      }
    }
    expect(check()).toBe(true);
  });
});

describe("CosrxError — isHttpError", () => {
  it("true when response present", () => {
    expect(new CosrxError("x", res(404), {}).isHttpError).toBe(true);
  });
  it("false when response null", () => {
    expect(new CosrxError("x", null, {}).isHttpError).toBe(false);
  });
});

describe("CosrxError — status", () => {
  it("returns status from response", () => {
    expect(new CosrxError("x", res(404), {}).status).toBe(404);
  });
  it("undefined when no response", () => {
    expect(new CosrxError("x", null, {}).status).toBeUndefined();
  });
});

describe("CosrxError — response and config", () => {
  it("stores response", () => {
    const r = res(500);
    expect(new CosrxError("x", r, {}).response).toBe(r);
  });
  it("stores config", () => {
    const c = { url: "/x" };
    expect(new CosrxError("x", null, c).config).toBe(c);
  });
});

describe("isCosrxError()", () => {
  it("true for CosrxError", () => {
    expect(isCosrxError(new CosrxError("x", null, {}))).toBe(true);
  });
  it("narrows type — status accessible after guard", () => {
    const e: unknown = new CosrxError("x", res(404), {});
    if (isCosrxError(e)) expect(e.status).toBe(404);
  });
  it("false for plain Error", () => {
    expect(isCosrxError(new Error("x"))).toBe(false);
  });
  it("false for null", () => {
    expect(isCosrxError(null)).toBe(false);
  });
  it("false for undefined", () => {
    expect(isCosrxError(undefined)).toBe(false);
  });
  it("false for string", () => {
    expect(isCosrxError("x")).toBe(false);
  });
});
