import { serializeBody } from "../src/core/SerializeBody.js";
import { describe, it, expect } from "vitest";

describe("serializeBody — null/undefined", () => {
  it("returns null body for null", () => {
    const r = serializeBody(null);
    expect(r.body).toBeNull();
    expect(r.headers).toEqual({});
    expect(r.deleteHeaders).toBeUndefined();
  });
  it("returns null body for undefined", () => {
    expect(serializeBody(undefined).body).toBeNull();
  });
});

describe("serializeBody — plain objects/arrays", () => {
  it("JSON-stringifies object and sets Content-Type", () => {
    const r = serializeBody({ name: "test" });
    expect(r.body).toBe(JSON.stringify({ name: "test" }));
    expect(r.headers["Content-Type"]).toBe("application/json");
    expect(r.deleteHeaders).toBeUndefined();
  });
  it("JSON-stringifies array", () => {
    const r = serializeBody([1, 2, 3]);
    expect(r.body).toBe("[1,2,3]");
    expect(r.headers["Content-Type"]).toBe("application/json");
  });
  it("JSON-stringifies nested object", () => {
    const d = { user: { name: "test" } };
    expect(serializeBody(d).body).toBe(JSON.stringify(d));
  });
});

describe("serializeBody — string", () => {
  it("passes string through with no Content-Type", () => {
    const r = serializeBody("raw");
    expect(r.body).toBe("raw");
    expect(r.headers).toEqual({});
    expect(r.deleteHeaders).toBeUndefined();
  });
  it("handles empty string", () => {
    expect(serializeBody("").body).toBe("");
  });
});

describe("serializeBody — FormData", () => {
  it("passes FormData through with no headers", () => {
    const fd = new FormData();
    const r = serializeBody(fd);
    expect(r.body).toBe(fd);
    expect(r.headers).toEqual({});
  });
  it("includes Content-Type in deleteHeaders", () => {
    expect(serializeBody(new FormData()).deleteHeaders).toContain(
      "Content-Type",
    );
  });
});

describe("serializeBody — URLSearchParams", () => {
  it("passes URLSearchParams through", () => {
    const p = new URLSearchParams({ a: "1" });
    const r = serializeBody(p);
    expect(r.body).toBe(p);
    expect(r.headers).toEqual({});
  });
  it("includes Content-Type in deleteHeaders", () => {
    expect(serializeBody(new URLSearchParams()).deleteHeaders).toContain(
      "Content-Type",
    );
  });
});

describe("serializeBody — Blob", () => {
  it("passes Blob through with deleteHeaders", () => {
    const b = new Blob(["data"]);
    const r = serializeBody(b);
    expect(r.body).toBe(b);
    expect(r.deleteHeaders).toContain("Content-Type");
  });
});

describe("serializeBody — ArrayBuffer", () => {
  it("passes ArrayBuffer through with no headers", () => {
    const b = new ArrayBuffer(8);
    const r = serializeBody(b);
    expect(r.body).toBe(b);
    expect(r.headers).toEqual({});
    expect(r.deleteHeaders).toBeUndefined();
  });
});

describe("serializeBody — TypedArray", () => {
  it("passes Uint8Array through", () => {
    const v = new Uint8Array([1, 2, 3]);
    const r = serializeBody(v);
    expect(r.body).toBe(v);
    expect(r.headers).toEqual({});
  });
});
