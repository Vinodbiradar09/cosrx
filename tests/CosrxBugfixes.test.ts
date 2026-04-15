// import { CosrxError, isCosrxError } from "../src/types/index.js";
// import { describe, it, expect, vi, afterEach } from "vitest";
// import { Cosrx } from "../src/core/Cosrx.js";
// import cosrx from "../src/index.js";

// function mockFetch(
//   body: unknown,
//   opts: { status?: number; contentType?: string } = {},
// ) {
//   const { status = 200, contentType = "application/json" } = opts;
//   const str =
//     contentType === "application/json" ? JSON.stringify(body) : String(body);
//   return vi
//     .spyOn(globalThis, "fetch")
//     .mockResolvedValueOnce(
//       new Response(str, { status, headers: { "Content-Type": contentType } }),
//     );
// }

// function mockFetchAbortable() {
//   return vi.spyOn(globalThis, "fetch").mockImplementationOnce(
//     (_url: unknown, init: unknown): Promise<Response> =>
//       new Promise((_, reject) => {
//         const sig = (init as RequestInit).signal;
//         const abort = () => reject(new DOMException("Aborted", "AbortError"));
//         if (sig?.aborted) abort();
//         else sig?.addEventListener("abort", abort, { once: true });
//       }),
//   );
// }

// const originalDocument = (globalThis as any).document;

// function mockDocument(cookieValue: string) {
//   Object.defineProperty(globalThis, "document", {
//     value: { cookie: cookieValue },
//     writable: true,
//     configurable: true,
//   });
// }

// function restoreDocument() {
//   if (originalDocument === undefined) {
//     delete (globalThis as any).document;
//   } else {
//     Object.defineProperty(globalThis, "document", {
//       value: originalDocument,
//       writable: true,
//       configurable: true,
//     });
//   }
// }

// afterEach(() => {
//   vi.restoreAllMocks();
//   restoreDocument();
// });

// describe("Bug 2 — mergeTransformers returns undefined (not []) when no transforms", () => {
//   it("request with no transforms serializes body correctly", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({});
//     await api.post("/users", { name: "Vinod" });
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(JSON.parse(init.body as string)).toEqual({ name: "Vinod" });
//   });

//   it("GET with no transforms resolves correctly", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({ id: 1 });
//     const res = await api.get("/users/1");
//     expect(res.data).toEqual({ id: 1 });
//   });
// });

// describe("Bug 5 — XSRF does not overwrite a manually set header", () => {
//   it("manual X-XSRF-TOKEN header survives when cookie is also present", async () => {
//     mockDocument("XSRF-TOKEN=from-cookie");
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: true,
//     });
//     mockFetch({});
//     await api.post("/api", {}, { headers: { "X-XSRF-TOKEN": "manual-token" } });
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe(
//       "manual-token",
//     );
//   });

//   it("cookie value is used when no manual XSRF header is present", async () => {
//     mockDocument("XSRF-TOKEN=from-cookie");
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: true,
//     });
//     mockFetch({});
//     await api.post("/api", {});
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe(
//       "from-cookie",
//     );
//   });
// });

// describe("Bug 7 — readCookie handles base64 cookie values containing '='", () => {
//   it("reads a base64 token with trailing '=' padding correctly", async () => {
//     const token = "abc123==";
//     mockDocument(`XSRF-TOKEN=${token}; session=xyz`);
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: true,
//     });
//     mockFetch({});
//     await api.post("/api", {});
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe(
//       token,
//     );
//   });

//   it("reads a cookie value containing multiple '=' signs", async () => {
//     const token = "dGVzdA==extra=";
//     mockDocument(`XSRF-TOKEN=${token}`);
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: true,
//     });
//     mockFetch({});
//     await api.post("/api", {});
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe(
//       token,
//     );
//   });
// });

// describe("Bug 9 — anySignal polyfill works when AbortSignal.any is absent (Node 18)", () => {
//   it("timeout aborts the request when polyfill is active", async () => {
//     const original = AbortSignal.any;
//     (AbortSignal as any).any = undefined;
//     try {
//       const api = new Cosrx({ baseURL: "http://api.example.com", timeout: 50 });
//       mockFetchAbortable();
//       const e = await api.get("/slow").catch((e) => e);
//       expect(isCosrxError(e)).toBe(true);
//       expect(e.message).toBe("Request aborted");
//     } finally {
//       (AbortSignal as any).any = original;
//     }
//   }, 3000);

//   it("userSignal abort works when polyfill is active", async () => {
//     const original = AbortSignal.any;
//     (AbortSignal as any).any = undefined;
//     try {
//       const api = new Cosrx({ baseURL: "http://api.example.com" });
//       const ac = new AbortController();
//       mockFetchAbortable();
//       const req = api.get("/slow", { signal: ac.signal }).catch((e) => e);
//       ac.abort();
//       await Promise.resolve();
//       const e = await req;
//       expect(isCosrxError(e)).toBe(true);
//       expect(e.message).toBe("Request aborted");
//     } finally {
//       (AbortSignal as any).any = original;
//     }
//   });
// });

// describe("Bug 10 — cosrxRes.config contains the full merged config", () => {
//   it("validateStatus is accessible on res.config inside a response interceptor", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     let captured: unknown;
//     api.interceptors.response.use((res) => {
//       captured = (res.config as any).validateStatus;
//       return res;
//     });
//     const fn = (s: number) => s < 500;
//     mockFetch({});
//     await api.get("/", { validateStatus: fn });
//     expect(captured).toBe(fn);
//   });

//   it("responseType is accessible on res.config", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     let captured: unknown;
//     api.interceptors.response.use((res) => {
//       captured = (res.config as any).responseType;
//       return res;
//     });
//     mockFetch("text", { contentType: "text/plain" });
//     await api.get("/", { responseType: "text" });
//     expect(captured).toBe("text");
//   });

//   it("baseURL is accessible on res.config", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     let captured: unknown;
//     api.interceptors.response.use((res) => {
//       captured = (res.config as any).baseURL;
//       return res;
//     });
//     mockFetch({});
//     await api.get("/users");
//     expect(captured).toBe("http://api.example.com");
//   });

//   it("retry config is accessible on res.config", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     let captured: unknown;
//     api.interceptors.response.use((res) => {
//       captured = (res.config as any).retry;
//       return res;
//     });
//     const retryConfig = { times: 2, delay: 0, jitter: false };
//     mockFetch({});
//     await api.get("/", { retry: retryConfig });
//     expect(captured).toEqual(retryConfig);
//   });
// });

// describe("cosrx.create() — instance isolation", () => {
//   it("returns a new working Cosrx instance", async () => {
//     const api = cosrx.create({ baseURL: "http://api.example.com" });
//     mockFetch({ created: true });
//     const res = await api.get("/test");
//     expect(res.data).toEqual({ created: true });
//   });

//   it("has independent interceptors from the default instance", async () => {
//     const api = cosrx.create({ baseURL: "http://api.example.com" });
//     const fn = vi.fn((c: unknown) => c);
//     api.interceptors.request.use(fn as any);
//     expect(cosrx.interceptors.request.handlers).toHaveLength(0);
//     expect(api.interceptors.request.handlers).toHaveLength(1);
//   });

//   it("two created instances are isolated from each other", async () => {
//     const api1 = cosrx.create({ baseURL: "http://api1.example.com" });
//     const api2 = cosrx.create({ baseURL: "http://api2.example.com" });
//     expect(api1.interceptors.request.handlers).not.toBe(
//       api2.interceptors.request.handlers,
//     );
//   });
// });

// describe("CosrxError — unicode and special characters in message", () => {
//   it("preserves unicode characters", () => {
//     const err = new CosrxError("Erreur réseau: 서버 오류 🚫", null, {});
//     expect(err.message).toBe("Erreur réseau: 서버 오류 🚫");
//     expect(err.name).toBe("CosrxError");
//     expect(err).toBeInstanceOf(CosrxError);
//   });
// });
