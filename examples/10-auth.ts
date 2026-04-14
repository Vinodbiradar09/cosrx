/**
 * 10 — Authentication
 * Cosrx has no built-in auth you own it.
 * These are the standard patterns for attaching credentials.
 */
import cosrx from "@cosrx/core";
import type { CosrxConfig } from "@cosrx/core";

// Bearer token via instance headers

const TOKEN = "demo-bearer-token";

const authenticatedApi = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
});

const res = await authenticatedApi.get("/posts/1");
console.log("With static Bearer token:", res.status);

// Bearer token via interceptor (dynamic)
// Use this when the token can change (e.g. after refresh)

let currentToken = "initial-token";

const dynamicApi = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

dynamicApi.interceptors.request.use((config: CosrxConfig) => ({
  ...config,
  headers: {
    ...config.headers,
    Authorization: `Bearer ${currentToken}`,
  },
}));

const dynamic = await dynamicApi.get("/posts/1");
console.log("Dynamic token request:", dynamic.status);

// Simulate token rotation
currentToken = "refreshed-token";
const afterRefresh = await dynamicApi.get("/posts/2");
console.log("After token rotation:", afterRefresh.status);

// Basic auth

const credentials = btoa("username:password");

const basicRes = await cosrx.get(
  "https://jsonplaceholder.typicode.com/posts/1",
  {
    headers: { Authorization: `Basic ${credentials}` },
  },
);
console.log("Basic auth request:", basicRes.status);

// API key in header

const apiKeyApi = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  headers: { "X-API-Key": "my-secret-api-key" },
});

const apiKeyRes = await apiKeyApi.get("/posts/1");
console.log("API key request:", apiKeyRes.status);

// API key in query params

const paramKeyRes = await cosrx.get(
  "https://jsonplaceholder.typicode.com/posts/1",
  {
    params: { apiKey: "my-secret-key" },
  },
);
console.log("API key in params:", paramKeyRes.status);

// Cookies: same-origin (browser)
// In a browser, cookies are sent automatically for same-origin requests.
// Nothing to configure.

// Cookies: cross-origin (browser)
// Pass credentials: "include" - the server must allow it via CORS headers.

const corsRes = await cosrx.get(
  "https://jsonplaceholder.typicode.com/posts/1",
  {
    credentials: "include",
  },
);
console.log("Cross-origin with credentials:", corsRes.status);

// Next.js server-side: forward cookies manually
// In Next.js server components or Route Handlers, cookies are NOT forwarded
// automatically. You must pass them explicitly.

async function serverSideFetch(cookieHeader: string) {
  return cosrx.get("https://jsonplaceholder.typicode.com/posts/1", {
    headers: { Cookie: cookieHeader },
  });
}

// Simulated — in real Next.js: import { cookies } from "next/headers"
const ssrRes = await serverSideFetch("session=abc123; theme=dark");
console.log("SSR with forwarded cookies:", ssrRes.status);
