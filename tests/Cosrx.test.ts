import { CancelController } from "../src/core/CancelController.js";
import { CosrxError, isCosrxError } from "../src/types/index.js";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Cosrx } from "../src/core/Cosrx.js";

function mockFetch(
  body: unknown,
  opts: { status?: number; contentType?: string } = {},
) {
  const { status = 200, contentType = "application/json" } = opts;
  const str =
    contentType === "application/json" ? JSON.stringify(body) : String(body);
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(str, { status, headers: { "Content-Type": contentType } }),
    );
}

function mockFetchNetworkError(msg = "Network failure") {
  return vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error(msg));
}

function mockFetchAbortable() {
  return vi.spyOn(globalThis, "fetch").mockImplementationOnce(
    (_url: unknown, init: unknown): Promise<Response> =>
      new Promise((_, reject) => {
        const sig = (init as RequestInit).signal;
        const abort = () => reject(new DOMException("Aborted", "AbortError"));
        if (sig?.aborted) abort();
        else sig?.addEventListener("abort", abort, { once: true });
      }),
  );
}

afterEach(() => vi.restoreAllMocks());

describe("Cosrx — constructor", () => {
  it("creates instance with empty config", () => {
    expect(() => new Cosrx()).not.toThrow();
  });
  it("accepts valid http baseURL", () => {
    expect(
      () => new Cosrx({ baseURL: "http://api.example.com" }),
    ).not.toThrow();
  });
  it("accepts valid https baseURL", () => {
    expect(
      () => new Cosrx({ baseURL: "https://api.example.com" }),
    ).not.toThrow();
  });
  it("throws CosrxError for invalid baseURL (no protocol)", () => {
    expect(() => new Cosrx({ baseURL: "localhost:3000" })).toThrow(CosrxError);
  });
  it("throws CosrxError for completely unparseable baseURL", () => {
    expect(() => new Cosrx({ baseURL: "not a url///" })).toThrow(CosrxError);
  });
  it("throws CosrxError for ftp:// protocol", () => {
    expect(() => new Cosrx({ baseURL: "ftp://files.example.com" })).toThrow(
      CosrxError,
    );
  });
  it("invalid baseURL error message is descriptive", () => {
    try {
      new Cosrx({ baseURL: "localhost:3000" });
    } catch (err) {
      expect(isCosrxError(err)).toBe(true);
      expect((err as CosrxError).message).toContain("localhost:3000");
    }
  });
  it("stores instance headers", async () => {
    mockFetch({});
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      headers: { "X-App": "cosrx" },
    });
    await api.get("/users");
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect((init.headers as Record<string, string>)?.["X-App"]).toBe("cosrx");
  });
});

describe("Cosrx — HTTP helpers", () => {
  const api = new Cosrx({ baseURL: "http://api.example.com" });

  it.each(["get", "head", "delete", "options"] as const)(
    "%s() sets correct method",
    async (method) => {
      mockFetch({});
      await (api[method] as Function)("/path");
      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
        string,
        RequestInit,
      ];
      expect(init.method).toBe(method.toUpperCase());
    },
  );

  it.each(["post", "put", "patch"] as const)(
    "%s() serialises JSON body",
    async (method) => {
      mockFetch({});
      await (api[method] as Function)("/path", { name: "test" });
      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
        string,
        RequestInit,
      ];
      expect(init.body).toBe(JSON.stringify({ name: "test" }));
      expect(init.method).toBe(method.toUpperCase());
    },
  );

  it("post() prefers explicit data over config.data", async () => {
    mockFetch({});
    await api.post("/path", { explicit: true }, { data: { fromConfig: true } });
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(init.body).toBe(JSON.stringify({ explicit: true }));
  });

  it("post() falls back to config.data when data is undefined", async () => {
    mockFetch({});
    await api.post("/path", undefined, { data: { fromConfig: true } });
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(init.body).toBe(JSON.stringify({ fromConfig: true }));
  });

  it("get() works with no config argument", async () => {
    const api2 = new Cosrx({ baseURL: "http://api.example.com" });
    mockFetch([]);
    const res = await api2.get("/users");
    expect(res.status).toBe(200);
  });
});

describe("Cosrx — URL construction", () => {
  it("resolves path against versioned baseURL correctly", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com/v1" });
    mockFetch({});
    await api.get("/users");
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toBe("http://api.example.com/v1/users");
  });

  it("appends params as query string", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    mockFetch({});
    await api.get("/search", { params: { q: "hello", page: 2 } });
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("q=hello");
    expect(url).toContain("page=2");
  });

  it("uses repeat arrayFormat by default", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    mockFetch({});
    await api.get("/users", { params: { ids: [1, 2, 3] } });
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("ids=1");
    expect(url).toContain("ids=2");
    expect(url).toContain("ids=3");
  });

  it("respects instance arrayFormat", async () => {
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      arrayFormat: "bracket",
    });
    mockFetch({});
    await api.get("/users", { params: { ids: [1, 2] } });
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("ids%5B%5D=1");
  });
});

describe("Cosrx — response parsing", () => {
  const api = new Cosrx({ baseURL: "http://api.example.com" });

  it("parses JSON response", async () => {
    mockFetch({ id: 1, name: "test" });
    const r = await api.get("/user");
    expect(r.data).toEqual({ id: 1, name: "test" });
  });
  it("returns empty object for empty JSON body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect((await api.get("/empty")).data).toEqual({});
  });
  it("returns text for non-JSON responses", async () => {
    mockFetch("plain text", { contentType: "text/plain" });
    expect((await api.get("/text")).data).toBe("plain text");
  });
  it("returns null data when body parse fails but preserves status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("bad}{json", {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const err = await api.get("/broken").catch((e) => e);
    expect(isCosrxError(err)).toBe(true);
    expect(err.status).toBe(500);
    expect(err.response?.data).toBeNull();
  });
  it("populates rawResponse", async () => {
    mockFetch({ ok: true });
    const r = await api.get("/");
    expect(r.rawResponse).toBeInstanceOf(Response);
  });
  it("responseType: 'text' returns string", async () => {
    mockFetch({ id: 1 });
    const r = await api.get("/", { responseType: "text" });
    expect(typeof r.data).toBe("string");
  });
  it("responseType: 'json' forces JSON parse", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ forced: true }), {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );
    expect((await api.get("/", { responseType: "json" })).data).toEqual({
      forced: true,
    });
  });
  it("responseType: 'blob' returns Blob", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("bin", {
        status: 200,
        headers: { "Content-Type": "application/octet-stream" },
      }),
    );
    expect(
      (await api.get("/file", { responseType: "blob" })).data,
    ).toBeInstanceOf(Blob);
  });
  it("responseType: 'arrayBuffer' returns ArrayBuffer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(new Uint8Array([1, 2, 3]).buffer, { status: 200 }),
    );
    expect(
      (await api.get("/bin", { responseType: "arrayBuffer" })).data,
    ).toBeInstanceOf(ArrayBuffer);
  });
  it("responseType: 'stream' returns ReadableStream", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("data", { status: 200 }),
    );
    expect(
      (await api.get("/stream", { responseType: "stream" })).data,
    ).toBeInstanceOf(ReadableStream);
  });
  it("auto: returns text for XML content type", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<root/>", {
        status: 200,
        headers: { "Content-Type": "application/xml" },
      }),
    );
    expect((await api.get("/xml")).data).toBe("<root/>");
  });
});

describe("Cosrx — error handling", () => {
  const api = new Cosrx({ baseURL: "http://api.example.com" });

  it("throws CosrxError for 4xx", async () => {
    mockFetch({ msg: "nf" }, { status: 404 });
    await expect(api.get("/x")).rejects.toThrow(CosrxError);
  });
  it("throws CosrxError for 5xx", async () => {
    mockFetch({ msg: "err" }, { status: 500 });
    await expect(api.get("/x")).rejects.toThrow(CosrxError);
  });
  it("CosrxError carries status", async () => {
    mockFetch({}, { status: 403 });
    const e = await api.get("/x").catch((e) => e);
    expect(isCosrxError(e)).toBe(true);
    expect(e.status).toBe(403);
    expect(e.isHttpError).toBe(true);
  });
  it("CosrxError carries parsed response body", async () => {
    mockFetch({ detail: "rate limited" }, { status: 429 });
    const e = await api.get("/x").catch((e) => e);
    expect(e.response?.data).toEqual({ detail: "rate limited" });
  });
  it("throws CosrxError for network failures", async () => {
    mockFetchNetworkError("Failed to fetch");
    const e = await api.get("/x").catch((e) => e);
    expect(isCosrxError(e)).toBe(true);
    expect(e.isHttpError).toBe(false);
    expect(e.response).toBeNull();
    expect(e.message).toBe("Failed to fetch");
  });
});

describe("Cosrx — validateStatus", () => {
  it("treats 404 as success when validateStatus allows it", async () => {
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      validateStatus: (s) => s < 500,
    });
    mockFetch({ msg: "nf" }, { status: 404 });
    expect((await api.get("/x")).status).toBe(404);
  });
  it("treats 200 as error when validateStatus rejects it", async () => {
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      validateStatus: () => false,
    });
    mockFetch({});
    await expect(api.get("/")).rejects.toThrow(CosrxError);
  });
  it("per-request validateStatus overrides instance", async () => {
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      validateStatus: () => false,
    });
    mockFetch({});
    expect((await api.get("/", { validateStatus: () => true })).status).toBe(
      200,
    );
  });
});

describe("Cosrx — header merging", () => {
  it("merges instance and per-request headers", async () => {
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      headers: { "Content-Type": "application/json", "X-App": "cosrx" },
    });
    mockFetch({});
    await api.get("/", { headers: { Authorization: "Bearer token" } });
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const h = init.headers as Record<string, string>;
    expect(h["Content-Type"]).toBe("application/json");
    expect(h["X-App"]).toBe("cosrx");
    expect(h["Authorization"]).toBe("Bearer token");
  });
  it("per-request headers override instance", async () => {
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      headers: { "Content-Type": "application/json" },
    });
    mockFetch({});
    await api.get("/", { headers: { "Content-Type": "text/plain" } });
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "text/plain",
    );
  });
});

describe("Cosrx — FormData body", () => {
  it("strips instance Content-Type when posting FormData", async () => {
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      headers: { "Content-Type": "application/json" },
    });
    mockFetch({});
    await api.post("/upload", new FormData());
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const keys = Object.keys(init.headers as Record<string, string>).map((k) =>
      k.toLowerCase(),
    );
    expect(keys).not.toContain("content-type");
  });
  it("strips lowercase content-type for FormData", async () => {
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      headers: { "content-type": "application/json" },
    });
    mockFetch({});
    await api.post("/upload", new FormData());
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const keys = Object.keys(init.headers as Record<string, string>).map((k) =>
      k.toLowerCase(),
    );
    expect(keys).not.toContain("content-type");
  });
  it("strips Content-Type for URLSearchParams", async () => {
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      headers: { "Content-Type": "application/json" },
    });
    mockFetch({});
    await api.post("/form", new URLSearchParams({ a: "1" }));
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const keys = Object.keys(init.headers as Record<string, string>).map((k) =>
      k.toLowerCase(),
    );
    expect(keys).not.toContain("content-type");
  });
  it("strips Content-Type for Blob", async () => {
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      headers: { "Content-Type": "application/json" },
    });
    mockFetch({});
    await api.post("/upload", new Blob(["data"]));
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const keys = Object.keys(init.headers as Record<string, string>).map((k) =>
      k.toLowerCase(),
    );
    expect(keys).not.toContain("content-type");
  });
  it("FormData works with no instance headers set", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    const fd = new FormData();
    fd.append("file", "content");
    mockFetch({});
    const res = await api.post("/upload", fd);
    expect(res.status).toBe(200);
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(init.body).toBe(fd);
  });
});

describe("Cosrx — nativeConfig cleanliness", () => {
  it("does not pass lota-specific fields to fetch", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com", timeout: 5000 });
    mockFetch({});
    await api.post(
      "/users",
      { name: "test" },
      { params: { v: 2 }, dedupeKey: "x", retry: false },
    );
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const keys = Object.keys(init);
    [
      "baseURL",
      "timeout",
      "params",
      "data",
      "url",
      "dedupeKey",
      "retry",
      "validateStatus",
      "responseType",
      "arrayFormat",
    ].forEach((k) => {
      expect(keys).not.toContain(k);
    });
  });
});

describe("Cosrx — request interceptors", () => {
  it("mutates config before dispatch", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    api.interceptors.request.use((c) => ({
      ...c,
      headers: { ...c.headers, Authorization: "Bearer injected" },
    }));
    mockFetch({});
    await api.get("/secure");
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer injected",
    );
  });
  it("runs in LIFO order", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    const order: number[] = [];
    api.interceptors.request.use((c) => {
      order.push(1);
      return c;
    });
    api.interceptors.request.use((c) => {
      order.push(2);
      return c;
    });
    mockFetch({});
    await api.get("/");
    expect(order).toEqual([2, 1]);
  });
  it("ejected interceptor does not run", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    const fn = vi.fn((c: unknown) => c);
    const id = api.interceptors.request.use(fn as any);
    api.interceptors.request.eject(id);
    mockFetch({});
    await api.get("/");
    expect(fn).not.toHaveBeenCalled();
  });
  it("rejected handler called on interceptor throw", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    const onRejected = vi.fn((e: unknown) => Promise.reject(e));
    api.interceptors.request.use(() => {
      throw new Error("boom");
    }, onRejected);
    mockFetch({});
    await expect(api.get("/")).rejects.toThrow();
    expect(onRejected).toHaveBeenCalledTimes(1);
  });
});

describe("Cosrx — response interceptors", () => {
  it("transforms response data", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    api.interceptors.response.use((r) => ({ ...r, data: { wrapped: r.data } }));
    mockFetch({ id: 1 });
    const res = await api.get("/user");
    expect(res.data).toEqual({ wrapped: { id: 1 } });
  });
  it("runs in FIFO order", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    const order: number[] = [];
    api.interceptors.response.use((r) => {
      order.push(1);
      return r;
    });
    api.interceptors.response.use((r) => {
      order.push(2);
      return r;
    });
    mockFetch({});
    await api.get("/");
    expect(order).toEqual([1, 2]);
  });
  it("rejected handler called on HTTP error", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    const onRejected = vi.fn((e: unknown) => Promise.reject(e));
    api.interceptors.response.use((r) => r, onRejected);
    mockFetch({}, { status: 404 });
    await expect(api.get("/")).rejects.toThrow();
    expect(onRejected).toHaveBeenCalledTimes(1);
  });
});

describe("Cosrx — timeout", () => {
  it("aborts request when timeout expires", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com", timeout: 50 });
    mockFetchAbortable();
    const e = await api.get("/slow").catch((e) => e);
    expect(isCosrxError(e)).toBe(true);
    expect(e.message).toBe("Request aborted");
  }, 3000);
  it("does not abort when request completes before timeout", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com", timeout: 5000 });
    mockFetch({ ok: true });
    expect((await api.get("/fast")).status).toBe(200);
  });
  it("per-request timeout overrides instance", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com", timeout: 9999 });
    mockFetchAbortable();
    const e = await api.get("/slow", { timeout: 50 }).catch((e) => e);
    expect(isCosrxError(e)).toBe(true);
    expect(e.message).toBe("Request aborted");
  }, 3000);
});

describe("Cosrx — deduplication", () => {
  it("aborts previous request when new one with same dedupeKey dispatched", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    mockFetchAbortable();
    mockFetch({ result: "second" });
    const p1 = api.get("/search", { dedupeKey: "search" }).catch((e) => e);
    const p2 = api.get("/search", { dedupeKey: "search" });
    const [err, res] = await Promise.all([p1, p2]);
    expect(CancelController.isCancelError(err)).toBe(true);
    expect(res.data).toEqual({ result: "second" });
  });
  it("does not affect different dedupeKeys", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    mockFetch({ a: 1 });
    mockFetch({ b: 2 });
    const [r1, r2] = await Promise.all([
      api.get("/a", { dedupeKey: "a" }),
      api.get("/b", { dedupeKey: "b" }),
    ]);
    expect(r1.data).toEqual({ a: 1 });
    expect(r2.data).toEqual({ b: 2 });
  });
  it("cleans up inFlight map after completion", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    mockFetch({ ok: true });
    await api.get("/users", { dedupeKey: "users" });
    mockFetch({ ok: true });
    expect((await api.get("/users", { dedupeKey: "users" })).status).toBe(200);
  });
});

describe("Cosrx — retry", () => {
  it("retries on 503 and succeeds on second attempt", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response("{}", {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const res = await api.get("/flaky", {
      retry: { times: 1, delay: 0, jitter: false },
    });
    expect(res.data).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("throws after exhausting retries", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const e = await api
      .get("/down", { retry: { times: 2, delay: 0, jitter: false } })
      .catch((e) => e);
    expect(isCosrxError(e)).toBe(true);
    expect(e.status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("does not retry 404", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await api
      .get("/missing", { retry: { times: 3, delay: 0, jitter: false } })
      .catch(() => {});
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("retry: false disables instance retry", async () => {
    const api = new Cosrx({
      baseURL: "http://api.example.com",
      retry: { times: 3, delay: 0, jitter: false },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await api
      .post("/payment", { amount: 100 }, { retry: false })
      .catch(() => {});
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("does not retry aborted requests", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com", timeout: 50 });
    mockFetchAbortable();
    const e = await api
      .get("/slow", { retry: { times: 3, delay: 0, jitter: false } })
      .catch((e) => e);
    expect(isCosrxError(e)).toBe(true);
    expect(e.message).toBe("Request aborted");
    expect(fetch).toHaveBeenCalledTimes(1);
  }, 3000);
  it("stops retrying when signal already aborted", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    const c = new AbortController();
    c.abort();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await api
      .get("/down", {
        signal: c.signal,
        retry: { times: 3, delay: 0, jitter: false },
      })
      .catch(() => {});
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("dedupeKey stripped from retry attempts (Bug 1 fix)", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    let calls = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      calls++;
      if (calls === 1)
        return new Response("{}", {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    const res = await api.get("/search", {
      dedupeKey: "search",
      retry: { times: 1, delay: 10, jitter: false },
    });
    expect(res.data).toEqual({ ok: true });
    expect(calls).toBe(2);
  });
});

describe("Cosrx — CancelController integration", () => {
  it("cancels in-flight request", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    const cc = new CancelController();
    mockFetchAbortable();
    const req = api.get("/slow", { signal: cc.signal }).catch((e) => e);
    cc.cancel("test");
    await Promise.resolve();
    expect(CancelController.isCancelError(await req)).toBe(true);
  });
  it("one controller cancels multiple requests", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    const cc = new CancelController();
    mockFetchAbortable();
    mockFetchAbortable();
    const p1 = api.get("/a", { signal: cc.signal }).catch((e) => e);
    const p2 = api.get("/b", { signal: cc.signal }).catch((e) => e);
    cc.cancel();
    await Promise.resolve();
    const [e1, e2] = await Promise.all([p1, p2]);
    expect(CancelController.isCancelError(e1)).toBe(true);
    expect(CancelController.isCancelError(e2)).toBe(true);
  });
  it("completed request not affected by late cancel", async () => {
    const api = new Cosrx({ baseURL: "http://api.example.com" });
    const cc = new CancelController();
    mockFetch({ ok: true });
    const res = await api.get("/fast", { signal: cc.signal });
    cc.cancel();
    expect(res.status).toBe(200);
  });
});
