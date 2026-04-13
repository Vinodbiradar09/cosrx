import { Interceptors } from "../src/core/Interceptors.js";
import { describe, it, expect } from "vitest";

describe("Interceptors — use()", () => {
  it("returns id 0 for first handler", () => {
    const i = new Interceptors<string>();
    expect(i.use((v) => v)).toBe(0);
  });
  it("increments id", () => {
    const i = new Interceptors<string>();
    expect(i.use((v) => v)).toBe(0);
    expect(i.use((v) => v)).toBe(1);
    expect(i.use((v) => v)).toBe(2);
  });
  it("stores fulfilled and rejected", () => {
    const i = new Interceptors<string>();
    const f = (v: string) => v;
    const r = (e: unknown) => e;
    i.use(f, r);
    expect(i.handlers[0]?.fulfilled).toBe(f);
    expect(i.handlers[0]?.rejected).toBe(r);
  });
  it("stores undefined rejected when omitted", () => {
    const i = new Interceptors<string>();
    i.use((v) => v);
    expect(i.handlers[0]?.rejected).toBeUndefined();
  });
});

describe("Interceptors — eject()", () => {
  it("nullifies handler", () => {
    const i = new Interceptors<string>();
    const id = i.use((v) => v);
    i.eject(id);
    expect(i.handlers[id]).toBeNull();
  });
  it("does not affect other handlers", () => {
    const i = new Interceptors<string>();
    i.use((v) => v);
    const id = i.use((v) => v);
    i.eject(id);
    expect(i.handlers[0]).not.toBeNull();
    expect(i.handlers[1]).toBeNull();
  });
  it("safe with out-of-range id", () => {
    const i = new Interceptors<string>();
    expect(() => i.eject(999)).not.toThrow();
  });
  it("safe to eject twice", () => {
    const i = new Interceptors<string>();
    const id = i.use((v) => v);
    i.eject(id);
    expect(() => i.eject(id)).not.toThrow();
  });
});

describe("Interceptors — clear()", () => {
  it("removes all handlers", () => {
    const i = new Interceptors<string>();
    i.use((v) => v);
    i.use((v) => v);
    i.clear();
    expect(i.handlers).toHaveLength(0);
  });
  it("safe on empty", () => {
    const i = new Interceptors<string>();
    expect(() => i.clear()).not.toThrow();
  });
});
