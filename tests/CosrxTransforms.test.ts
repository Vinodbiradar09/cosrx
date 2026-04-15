// import { describe, it, expect, vi, afterEach } from "vitest";
// import { Cosrx } from "../src/core/Cosrx.js";

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

// afterEach(() => vi.restoreAllMocks());

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

// describe("transformRequest — single function", () => {
//   it("transforms request data before serialization", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformRequest: (data) => ({ ...(data as object), injected: true }),
//     });
//     mockFetch({});
//     await api.post("/users", { name: "Vinod" });
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(JSON.parse(init.body as string)).toEqual({
//       name: "Vinod",
//       injected: true,
//     });
//   });

//   it("can mutate headers inside transformRequest", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformRequest: (data, headers) => {
//         headers["X-Custom"] = "from-transform";
//         return data;
//       },
//     });
//     mockFetch({});
//     await api.post("/users", { name: "Vinod" });
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["X-Custom"]).toBe(
//       "from-transform",
//     );
//   });

//   it("per-request transformRequest is applied", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({});
//     await api.post(
//       "/users",
//       { name: "Vinod" },
//       {
//         transformRequest: (data) => ({ ...(data as object), perRequest: true }),
//       },
//     );
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(JSON.parse(init.body as string)).toEqual({
//       name: "Vinod",
//       perRequest: true,
//     });
//   });

//   it("returning null sends null body", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({});
//     await api.post(
//       "/users",
//       { name: "Vinod" },
//       { transformRequest: () => null },
//     );
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(init.body).toBeNull();
//   });

//   it("returning undefined sends null body", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({});
//     await api.post(
//       "/users",
//       { name: "Vinod" },
//       { transformRequest: () => undefined },
//     );
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(init.body).toBeNull();
//   });

//   it("returning a string sends raw string body", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({});
//     await api.post(
//       "/users",
//       { name: "Vinod" },
//       { transformRequest: () => "raw-string" },
//     );
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(init.body).toBe("raw-string");
//   });

//   it("returning FormData strips Content-Type so browser sets boundary", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       headers: { "Content-Type": "application/json" },
//     });
//     mockFetch({});
//     const fd = new FormData();
//     fd.append("file", "data");
//     await api.post(
//       "/upload",
//       { name: "Vinod" },
//       { transformRequest: () => fd },
//     );
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     const keys = Object.keys(init.headers as Record<string, string>).map((k) =>
//       k.toLowerCase(),
//     );
//     expect(keys).not.toContain("content-type");
//     expect(init.body).toBe(fd);
//   });

//   it("runs on GET requests with undefined data", async () => {
//     const fn = vi.fn((data: unknown) => data);
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformRequest: fn,
//     });
//     mockFetch({});
//     await api.get("/users");
//     expect(fn).toHaveBeenCalledWith(undefined, expect.any(Object));
//   });
// });

// describe("transformRequest — array pipeline", () => {
//   it("runs all transformers in order", async () => {
//     const order: number[] = [];
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformRequest: [
//         (data) => {
//           order.push(1);
//           return { ...(data as object), step1: true };
//         },
//         (data) => {
//           order.push(2);
//           return { ...(data as object), step2: true };
//         },
//         (data) => {
//           order.push(3);
//           return { ...(data as object), step3: true };
//         },
//       ],
//     });
//     mockFetch({});
//     await api.post("/users", { name: "Vinod" });
//     expect(order).toEqual([1, 2, 3]);
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     const body = JSON.parse(init.body as string);
//     expect(body.step1).toBe(true);
//     expect(body.step2).toBe(true);
//     expect(body.step3).toBe(true);
//   });

//   it("output of each transformer feeds the next", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformRequest: [
//         (data: any) => ({ value: data.value * 2 }),
//         (data: any) => ({ value: data.value + 10 }),
//       ],
//     });
//     mockFetch({});
//     await api.post("/calc", { value: 5 });
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(JSON.parse(init.body as string)).toEqual({ value: 20 }); // (5*2)+10
//   });
// });

// describe("transformRequest — instance + per-request merge", () => {
//   it("instance transformers run before per-request ones", async () => {
//     const order: string[] = [];
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformRequest: (data) => {
//         order.push("instance");
//         return data;
//       },
//     });
//     mockFetch({});
//     await api.post(
//       "/users",
//       { name: "Vinod" },
//       {
//         transformRequest: (data) => {
//           order.push("per-request");
//           return data;
//         },
//       },
//     );
//     expect(order).toEqual(["instance", "per-request"]);
//   });
// });

// describe("transformResponse — single function", () => {
//   it("transforms response data after parsing", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformResponse: (data) => ({ ...(data as object), transformed: true }),
//     });
//     mockFetch({ id: 1, name: "Vinod" });
//     const res = await api.get("/users/1");
//     expect(res.data).toEqual({ id: 1, name: "Vinod", transformed: true });
//   });

//   it("receives Headers as second argument", async () => {
//     let capturedHeaders: Headers | null = null;
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformResponse: (data, headers) => {
//         capturedHeaders = headers;
//         return data;
//       },
//     });
//     mockFetch({ id: 1 });
//     await api.get("/users/1");
//     expect(capturedHeaders).toBeInstanceOf(Headers);
//     expect(
//       (capturedHeaders as unknown as Headers).get("content-type"),
//     ).toContain("application/json");
//   });

//   it("receives HTTP status as third argument", async () => {
//     let capturedStatus = 0;
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformResponse: (data, _headers, status) => {
//         capturedStatus = status;
//         return data;
//       },
//     });
//     mockFetch({ id: 1 });
//     await api.get("/users/1");
//     expect(capturedStatus).toBe(200);
//   });

//   it("per-request transformResponse is applied", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({ id: 1 });
//     const res = await api.get("/users/1", {
//       transformResponse: (data) => ({ wrapped: data }),
//     });
//     expect(res.data).toEqual({ wrapped: { id: 1 } });
//   });

//   it("can return a completely different shape", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformResponse: () => "completely different",
//     });
//     mockFetch({ id: 1 });
//     const res = await api.get("/users/1");
//     expect(res.data).toBe("completely different");
//   });

//   it("works with responseType: text", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformResponse: (data) => (data as string).toUpperCase(),
//     });
//     vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
//       new Response("hello world", {
//         status: 200,
//         headers: { "Content-Type": "text/plain" },
//       }),
//     );
//     const res = await api.get("/text", { responseType: "text" });
//     expect(res.data).toBe("HELLO WORLD");
//   });

//   it("returns raw parsed data when no transformResponse is set", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({ id: 1 });
//     const res = await api.get("/users/1");
//     expect(res.data).toEqual({ id: 1 });
//   });
// });

// describe("transformResponse — array pipeline", () => {
//   it("runs all transformers in order", async () => {
//     const order: number[] = [];
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformResponse: [
//         (data) => {
//           order.push(1);
//           return { ...(data as object), step1: true };
//         },
//         (data) => {
//           order.push(2);
//           return { ...(data as object), step2: true };
//         },
//       ],
//     });
//     mockFetch({ original: true });
//     const res = await api.get("/");
//     expect(order).toEqual([1, 2]);
//     expect((res.data as any).step1).toBe(true);
//     expect((res.data as any).step2).toBe(true);
//   });

//   it("output of each transformer feeds the next", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformResponse: [
//         (data: any) => ({ value: data.value * 2 }),
//         (data: any) => ({ value: data.value + 1 }),
//       ],
//     });
//     mockFetch({ value: 5 });
//     const res = await api.get("/");
//     expect((res.data as any).value).toBe(11); // (5*2)+1
//   });
// });

// describe("transformResponse — instance + per-request merge", () => {
//   it("instance transformers run before per-request ones", async () => {
//     const order: string[] = [];
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformResponse: (data) => {
//         order.push("instance");
//         return data;
//       },
//     });
//     mockFetch({ id: 1 });
//     await api.get("/users/1", {
//       transformResponse: (data) => {
//         order.push("per-request");
//         return data;
//       },
//     });
//     expect(order).toEqual(["instance", "per-request"]);
//   });
// });

// describe("transformRequest + transformResponse — combined", () => {
//   it("request and response transforms are independent pipelines", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       transformRequest: (data: any) => ({ ...data, sentAt: "2026" }),
//       transformResponse: (data: any) => ({ ...data, receivedAt: "2026" }),
//     });
//     mockFetch({ id: 1 });
//     const res = await api.post("/users", { name: "Vinod" });
//     expect((res.data as any).receivedAt).toBe("2026");
//     expect((res.data as any).id).toBe(1);
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(JSON.parse(init.body as string).sentAt).toBe("2026");
//   });
// });

// describe("auth — Basic Auth shorthand", () => {
//   it("sets Authorization: Basic header", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({});
//     await api.get("/secure", { auth: { username: "user", password: "pass" } });
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["Authorization"]).toBe(
//       `Basic ${btoa("user:pass")}`,
//     );
//   });

//   it("instance-level auth applies to every request", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       auth: { username: "admin", password: "secret" },
//     });
//     mockFetch({});
//     await api.get("/dashboard");
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["Authorization"]).toBe(
//       `Basic ${btoa("admin:secret")}`,
//     );
//   });

//   it("explicit Authorization header takes precedence over auth config", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({});
//     await api.get("/secure", {
//       auth: { username: "user", password: "pass" },
//       headers: { Authorization: "Bearer explicit-token" },
//     });
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["Authorization"]).toBe(
//       "Bearer explicit-token",
//     );
//   });

//   it("lowercase authorization header takes precedence over auth config", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({});
//     await api.get("/secure", {
//       auth: { username: "user", password: "pass" },
//       headers: { authorization: "Bearer lowercase" },
//     });
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(
//       (init.headers as Record<string, string>)["Authorization"],
//     ).toBeUndefined();
//     expect((init.headers as Record<string, string>)["authorization"]).toBe(
//       "Bearer lowercase",
//     );
//   });

//   it("auth is not forwarded to fetch as a field", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({});
//     await api.get("/", { auth: { username: "u", password: "p" } });
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(Object.keys(init)).not.toContain("auth");
//   });

//   it("no Authorization header when no auth config is set", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({});
//     await api.get("/public");
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(
//       (init.headers as Record<string, string>)["Authorization"],
//     ).toBeUndefined();
//   });

//   it("handles special characters in password via btoa", async () => {
//     const api = new Cosrx({ baseURL: "http://api.example.com" });
//     mockFetch({});
//     await api.get("/", { auth: { username: "user", password: "p@ss!123" } });
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["Authorization"]).toBe(
//       `Basic ${btoa("user:p@ss!123")}`,
//     );
//   });
// });

// describe("XSRF — Node.js environment (no document)", () => {
//   it("does not inject XSRF header when document is undefined", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: true,
//     });
//     mockFetch({});
//     await api.get("/api");
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(
//       (init.headers as Record<string, string>)["X-XSRF-TOKEN"],
//     ).toBeUndefined();
//   });

//   it("withXSRFToken: false never injects header", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: false,
//     });
//     mockFetch({});
//     await api.get("/api");
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(
//       (init.headers as Record<string, string>)["X-XSRF-TOKEN"],
//     ).toBeUndefined();
//   });
// });

// describe("XSRF — browser simulation", () => {
//   afterEach(restoreDocument);

//   it("injects XSRF-TOKEN cookie as X-XSRF-TOKEN header", async () => {
//     mockDocument("XSRF-TOKEN=abc123; session=xyz");
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: true,
//     });
//     mockFetch({});
//     await api.post("/api", { data: "test" });
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe(
//       "abc123",
//     );
//   });

//   it("does not inject header when cookie is absent", async () => {
//     mockDocument("session=xyz");
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
//     expect(
//       (init.headers as Record<string, string>)["X-XSRF-TOKEN"],
//     ).toBeUndefined();
//   });

//   it("respects custom xsrfCookieName", async () => {
//     mockDocument("MY-CSRF=mytoken123");
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: true,
//       xsrfCookieName: "MY-CSRF",
//     });
//     mockFetch({});
//     await api.post("/api", {});
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe(
//       "mytoken123",
//     );
//   });

//   it("respects custom xsrfHeaderName", async () => {
//     mockDocument("XSRF-TOKEN=abc123");
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: true,
//       xsrfHeaderName: "X-MY-CSRF-TOKEN",
//     });
//     mockFetch({});
//     await api.post("/api", {});
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["X-MY-CSRF-TOKEN"]).toBe(
//       "abc123",
//     );
//   });

//   it("withXSRFToken as function — injects when returns true", async () => {
//     mockDocument("XSRF-TOKEN=fntoken");
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: () => true,
//     });
//     mockFetch({});
//     await api.post("/api", {});
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect((init.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe(
//       "fntoken",
//     );
//   });

//   it("withXSRFToken as function — skips when returns false", async () => {
//     mockDocument("XSRF-TOKEN=fntoken");
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: () => false,
//     });
//     mockFetch({});
//     await api.post("/api", {});
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     expect(
//       (init.headers as Record<string, string>)["X-XSRF-TOKEN"],
//     ).toBeUndefined();
//   });

//   it("withXSRFToken function receives the config object", async () => {
//     mockDocument("XSRF-TOKEN=configtoken");
//     let receivedConfig: any = null;
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: (config) => {
//         receivedConfig = config;
//         return true;
//       },
//     });
//     mockFetch({});
//     await api.post("/api", {});
//     expect(receivedConfig).not.toBeNull();
//     expect(receivedConfig).toHaveProperty("baseURL", "http://api.example.com");
//   });

//   it("trims whitespace around cookie value", async () => {
//     mockDocument("other=val; XSRF-TOKEN= spaced-token ; session=abc");
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
//       "spaced-token",
//     );
//   });

//   it("does not overwrite a manually set XSRF header", async () => {
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

//   it("xsrf fields are not forwarded to fetch", async () => {
//     const api = new Cosrx({
//       baseURL: "http://api.example.com",
//       withXSRFToken: false,
//       xsrfCookieName: "MY-CSRF",
//       xsrfHeaderName: "X-MY-CSRF",
//     });
//     mockFetch({});
//     await api.get("/");
//     const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
//       string,
//       RequestInit,
//     ];
//     const keys = Object.keys(init);
//     expect(keys).not.toContain("xsrfCookieName");
//     expect(keys).not.toContain("xsrfHeaderName");
//     expect(keys).not.toContain("withXSRFToken");
//   });
// });
