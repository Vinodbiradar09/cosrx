import { buildParams } from "../src/core/BuildParams.js";
import { describe, it, expect } from "vitest";

function url() {
  return new URL("http://api.example.com/");
}

describe("buildParams scalars", () => {
  it("appends string", () => {
    const u = url();
    buildParams({ q: "hello" }, "repeat", u);
    expect(u.searchParams.get("q")).toBe("hello");
  });
  it("appends number", () => {
    const u = url();
    buildParams({ page: 2 }, "repeat", u);
    expect(u.searchParams.get("page")).toBe("2");
  });
  it("appends boolean", () => {
    const u = url();
    buildParams({ active: true }, "repeat", u);
    expect(u.searchParams.get("active")).toBe("true");
  });
  it("skips null", () => {
    const u = url();
    buildParams({ a: null }, "repeat", u);
    expect(u.searchParams.has("a")).toBe(false);
  });
  it("skips undefined", () => {
    const u = url();
    buildParams({ a: undefined }, "repeat", u);
    expect(u.searchParams.has("a")).toBe(false);
  });
  it("appends multiple scalars", () => {
    const u = url();
    buildParams({ q: "hi", page: 1 }, "repeat", u);
    expect(u.searchParams.get("q")).toBe("hi");
    expect(u.searchParams.get("page")).toBe("1");
  });
});

describe("buildParams — arrayFormat: repeat", () => {
  it("appends each value separately", () => {
    const u = url();
    buildParams({ ids: [1, 2, 3] }, "repeat", u);
    expect(u.searchParams.getAll("ids")).toEqual(["1", "2", "3"]);
  });
  it("handles string arrays", () => {
    const u = url();
    buildParams({ t: ["a", "b"] }, "repeat", u);
    expect(u.searchParams.getAll("t")).toEqual(["a", "b"]);
  });
  it("handles boolean arrays", () => {
    const u = url();
    buildParams({ f: [true, false] }, "repeat", u);
    expect(u.searchParams.getAll("f")).toEqual(["true", "false"]);
  });
  it("handles single-element array", () => {
    const u = url();
    buildParams({ ids: [42] }, "repeat", u);
    expect(u.searchParams.getAll("ids")).toEqual(["42"]);
  });
});

describe("buildParams — arrayFormat: comma", () => {
  it("joins into single param", () => {
    const u = url();
    buildParams({ ids: [1, 2, 3] }, "comma", u);
    expect(u.searchParams.get("ids")).toBe("1,2,3");
    expect(u.searchParams.getAll("ids")).toHaveLength(1);
  });
  it("handles string arrays", () => {
    const u = url();
    buildParams({ t: ["a", "b", "c"] }, "comma", u);
    expect(u.searchParams.get("t")).toBe("a,b,c");
  });
});

describe("buildParams — arrayFormat: bracket", () => {
  it("appends with bracket notation", () => {
    const u = url();
    buildParams({ ids: [1, 2, 3] }, "bracket", u);
    expect(u.searchParams.getAll("ids[]")).toEqual(["1", "2", "3"]);
    expect(u.searchParams.has("ids")).toBe(false);
  });
});

describe("buildParams — nested objects", () => {
  it("uses dot notation", () => {
    const u = url();
    buildParams({ filter: { status: "active" } }, "repeat", u);
    expect(u.searchParams.get("filter.status")).toBe("active");
  });
  it("handles multiple nested keys", () => {
    const u = url();
    buildParams({ filter: { status: "active", role: "admin" } }, "repeat", u);
    expect(u.searchParams.get("filter.status")).toBe("active");
    expect(u.searchParams.get("filter.role")).toBe("admin");
  });
  it("skips null inside nested", () => {
    const u = url();
    buildParams({ filter: { status: null } }, "repeat", u);
    expect(u.searchParams.has("filter.status")).toBe(false);
  });
  it("skips undefined inside nested", () => {
    const u = url();
    buildParams({ filter: { status: undefined } }, "repeat", u);
    expect(u.searchParams.has("filter.status")).toBe(false);
  });
  it("handles mixed scalar and nested", () => {
    const u = url();
    buildParams({ page: 1, filter: { status: "active" } }, "repeat", u);
    expect(u.searchParams.get("page")).toBe("1");
    expect(u.searchParams.get("filter.status")).toBe("active");
  });
});
