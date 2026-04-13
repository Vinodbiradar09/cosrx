import { buildRequestUrl } from "../src/core/BuildRequestUrl.js";
import { describe, it, expect } from "vitest";

describe("buildRequestUrl — absolute URLs", () => {
  it("returns absolute url as-is when no baseURL", () => {
    expect(
      buildRequestUrl(
        "http://example.com/users",
        undefined,
        undefined,
        undefined,
      ).toString(),
    ).toBe("http://example.com/users");
  });
  it("ignores baseURL when url is absolute", () => {
    expect(
      buildRequestUrl(
        "http://other.com/data",
        "http://api.example.com/v1",
        undefined,
        undefined,
      ).toString(),
    ).toBe("http://other.com/data");
  });
  it("handles absolute url with existing query string", () => {
    expect(
      buildRequestUrl(
        "http://example.com/users?a=1",
        undefined,
        undefined,
        undefined,
      ).searchParams.get("a"),
    ).toBe("1");
  });
});

describe("buildRequestUrl — URL normalisation (baseURL trailing slash fix)", () => {
  it("appends path to baseURL without trailing slash", () => {
    expect(
      buildRequestUrl(
        "/users",
        "http://api.example.com/v1",
        undefined,
        undefined,
      ).toString(),
    ).toBe("http://api.example.com/v1/users");
  });
  it("appends path to baseURL with trailing slash", () => {
    expect(
      buildRequestUrl(
        "/users",
        "http://api.example.com/v1/",
        undefined,
        undefined,
      ).toString(),
    ).toBe("http://api.example.com/v1/users");
  });
  it("handles relative path without leading slash", () => {
    expect(
      buildRequestUrl(
        "users",
        "http://api.example.com/v1",
        undefined,
        undefined,
      ).toString(),
    ).toBe("http://api.example.com/v1/users");
  });
  it("handles multi-segment baseURL path", () => {
    expect(
      buildRequestUrl(
        "/users",
        "http://api.example.com/v1/v2",
        undefined,
        undefined,
      ).toString(),
    ).toBe("http://api.example.com/v1/v2/users");
  });
  it("does not duplicate slashes", () => {
    const result = buildRequestUrl(
      "/users",
      "http://api.example.com/v1/",
      undefined,
      undefined,
    ).toString();
    expect(result).not.toContain("//users");
    expect(result).toBe("http://api.example.com/v1/users");
  });
});

describe("buildRequestUrl — params", () => {
  it("appends scalar params", () => {
    const u = buildRequestUrl(
      "/users",
      "http://api.example.com",
      { page: 1 },
      "repeat",
    );
    expect(u.searchParams.get("page")).toBe("1");
  });
  it("appends array params with repeat", () => {
    const u = buildRequestUrl(
      "/users",
      "http://api.example.com",
      { ids: [1, 2] },
      "repeat",
    );
    expect(u.searchParams.getAll("ids")).toEqual(["1", "2"]);
  });
  it("defaults to repeat when arrayFormat is undefined", () => {
    const u = buildRequestUrl(
      "/users",
      "http://api.example.com",
      { ids: [1, 2] },
      undefined,
    );
    expect(u.searchParams.getAll("ids")).toEqual(["1", "2"]);
  });
  it("does not append params when undefined", () => {
    expect(
      buildRequestUrl("/users", "http://api.example.com", undefined, undefined)
        .search,
    ).toBe("");
  });
  it("skips null param values", () => {
    expect(
      buildRequestUrl(
        "/users",
        "http://api.example.com",
        { a: null },
        "repeat",
      ).searchParams.has("a"),
    ).toBe(false);
  });
  it("throws when url is relative and no baseURL", () => {
    expect(() =>
      buildRequestUrl("/users", undefined, undefined, undefined),
    ).toThrow();
  });
});
