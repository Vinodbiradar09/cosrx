import { CosrxError, RETRY_DEFAULT_ON } from "../src/types/index.js";
import { shouldRetry } from "../src/core/ShouldRetry.js";
import { describe, it, expect } from "vitest";

function httpErr(status: number): CosrxError {
  return new CosrxError(
    `fail ${status}`,
    {
      data: null,
      status,
      statusText: "err",
      headers: new Headers(),
      config: {},
      rawResponse: new Response(),
    },
    {},
  );
}
const netErr = () => new CosrxError("Network error", null, {});
const abortErr = () => new CosrxError("Request aborted", null, {});

describe("shouldRetry — non-CosrxError", () => {
  it("returns false for plain Error", () => {
    expect(shouldRetry(new Error("oops"), { times: 3 })).toBe(false);
  });
  it("returns false for null", () => {
    expect(shouldRetry(null, { times: 3 })).toBe(false);
  });
  it("returns false for string", () => {
    expect(shouldRetry("err", { times: 3 })).toBe(false);
  });
  it("returns false for undefined", () => {
    expect(shouldRetry(undefined, { times: 3 })).toBe(false);
  });
});

describe("shouldRetry — aborted", () => {
  it("never retries aborted requests", () => {
    expect(shouldRetry(abortErr(), { times: 3 })).toBe(false);
  });
  it("never retries aborted even with matching status", () => {
    expect(shouldRetry(abortErr(), { times: 3, on: [503] })).toBe(false);
  });
});

describe("shouldRetry — network errors", () => {
  it("retries network errors by default", () => {
    expect(shouldRetry(netErr(), { times: 3 })).toBe(true);
  });
  it("retries network errors even with empty on list", () => {
    expect(shouldRetry(netErr(), { times: 3, on: [] })).toBe(true);
  });
});

describe("shouldRetry — default on list", () => {
  RETRY_DEFAULT_ON.forEach((s) => {
    it(`retries ${s}`, () => {
      expect(shouldRetry(httpErr(s), { times: 3 })).toBe(true);
    });
  });
  [400, 401, 403, 404, 405, 422].forEach((s) => {
    it(`does not retry ${s}`, () => {
      expect(shouldRetry(httpErr(s), { times: 3 })).toBe(false);
    });
  });
});

describe("shouldRetry — custom on list", () => {
  it("retries when status in custom list", () => {
    expect(shouldRetry(httpErr(422), { times: 3, on: [422] })).toBe(true);
  });
  it("does not retry when status not in custom list", () => {
    expect(shouldRetry(httpErr(503), { times: 3, on: [422] })).toBe(false);
  });
  it("empty on list — no HTTP retries", () => {
    expect(shouldRetry(httpErr(503), { times: 3, on: [] })).toBe(false);
  });
});
