# Cosrx

Cosrx is a promise-based HTTP client built on top of the native Fetch API, providing an Axios-style API with retries, interceptors, cancellation, request deduplication, and flexible configuration.

It is designed to stay close to web standards while offering the ergonomics required for real-world applications.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Creating an Instance](#creating-an-instance)
- [HTTP Methods](#http-methods)
- [Request Configuration](#request-configuration)
- [Query Parameters](#query-parameters)
- [Request Body Serialization](#request-body-serialization)
- [Response Structure](#response-structure)
- [Response Types](#response-types)
- [Interceptors](#interceptors)
- [Retry](#retry)
- [Timeout](#timeout)
- [Request Deduplication](#request-deduplication)
- [Cancellation](#cancellation)
- [Custom Status Validation](#custom-status-validation)
- [Error Handling](#error-handling)
- [Authentication](#authentication)
- [Cookies](#cookies)
- [TypeScript](#typescript)
- [Next.js](#nextjs)
- [Design Philosophy](#design-philosophy)

---

## Features

- Built on the native Fetch API no extra dependencies
- Axios-style API: `get`, `post`, `put`, `patch`, `delete`, `head`, `options`
- Request and response interceptors with `eject` and `clear` support
- Built-in retry with exponential backoff, fixed delay, and jitter
- Request cancellation via `CancelController` or any `AbortSignal`
- Request deduplication only the latest in-flight request with a given key survives
- Configurable timeout using `AbortController` internally
- Automatic body serialization (JSON, FormData, URLSearchParams, Blob, ArrayBuffer, strings)
- Flexible query parameter serialization: `repeat`, `comma`, `bracket`, and dot-notation for nested objects
- Multiple response types: `json`, `text`, `blob`, `arrayBuffer`, `stream`, `auto`
- Typed errors via `CosrxError` with `isHttpError`, `status`, `response`, and `config`
- `baseURL` validation at instance creation time
- Full TypeScript support with generics
- Works in browsers, Node.js 18+, and Next.js (client and server)

---

## Installation

```bash
npm install @cosrx/core
```

```bash
yarn add @cosrx/core
```

```bash
pnpm add @cosrx/core
```

---

## Quick Start

```ts
import cosrx from "@cosrx/core";

const res = await cosrx.get("https://api.example.com/users");
console.log(res.data);
```

---

## Creating an Instance

Use `cosrx.create()` to create isolated instances with their own base configuration, interceptors, and in-flight request tracking.

```ts
import cosrx from "@cosrx/core";

const api = cosrx.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
    "X-App-Version": "1.0.0",
  },
});
```

Or import the `Cosrx` class directly for subclassing or manual instantiation:

```ts
import { Cosrx } from "@cosrx/core";

const api = new Cosrx({
  baseURL: "https://api.example.com",
  timeout: 5000,
});
```

**Note:** `baseURL` must be an absolute URL with `http` or `https` protocol. An invalid `baseURL` throws a `CosrxError` immediately at construction time not at request time.

```ts
// Throws CosrxError immediately
const api = new Cosrx({ baseURL: "not-a-valid-url" });

// Also throws ftp, ws, etc. are not accepted
const api = new Cosrx({ baseURL: "ftp://files.example.com" });
```

Each instance maintains its own:

- Base configuration (headers, timeout, retry, etc.)
- Request and response interceptors
- In-flight request map (for deduplication)

---

## HTTP Methods

### No-body methods

```ts
api.get("/users");
api.head("/health");
api.delete("/users/1");
api.options("/users");
```

### Body methods

```ts
api.post("/users", { name: "Vinod" });
api.put("/users/1", { name: "Updated Name" });
api.patch("/users/1", { active: false });
```

Data can also be passed via `config.data`:

```ts
api.post("/users", undefined, { data: { name: "Vinod" } });
```

When both `data` argument and `config.data` are provided, the `data` argument takes precedence.

---

## Request Configuration

Every method accepts an optional config object that extends the native `RequestInit`:

```ts
api.get("/users", {
  params: { page: 1, limit: 20 },
  timeout: 3000,
  responseType: "json",
  headers: {
    "X-Request-ID": "abc-123",
  },
});
```

### Full Configuration Reference

```ts
interface CosrxConfig extends RequestInit {
  // URL
  url?: string;
  baseURL?: string;

  // Query parameters
  params?: Record<string, ParamValue>;
  arrayFormat?: "repeat" | "comma" | "bracket";

  // Request body
  data?: unknown;

  // Timing
  timeout?: number;

  // Response
  responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream" | "auto";
  validateStatus?: (status: number) => boolean;

  // Deduplication
  dedupeKey?: string;

  // Retry
  retry?: RetryConfig | false;

  // Cancellation (any AbortSignal)
  signal?: AbortSignal;

  // All native fetch options are also accepted:
  // credentials, cache, mode, redirect, referrerPolicy, etc.
}
```

All unrecognized options are forwarded directly to `fetch`.

---

## Query Parameters

### Primitive values

```ts
api.get("/search", {
  params: {
    q: "typescript",
    page: 2,
    active: true,
  },
});
// → /search?q=typescript&page=2&active=true
```

### Arrays

Control how arrays are serialized with `arrayFormat`:

```ts
// repeat (default) → ids=1&ids=2&ids=3
api.get("/items", {
  params: { ids: [1, 2, 3] },
  arrayFormat: "repeat",
});

// comma → ids=1,2,3
api.get("/items", {
  params: { ids: [1, 2, 3] },
  arrayFormat: "comma",
});

// bracket → ids[]=1&ids[]=2&ids[]=3
api.get("/items", {
  params: { ids: [1, 2, 3] },
  arrayFormat: "bracket",
});
```

### Nested objects

Nested objects are flattened using dot notation:

```ts
api.get("/users", {
  params: {
    filter: { role: "admin", active: true },
  },
});
// → /users?filter.role=admin&filter.active=true
```

### Null and undefined values

`null` and `undefined` param values are silently skipped and never appended to the URL:

```ts
api.get("/users", {
  params: { role: "admin", page: undefined, limit: null },
});
// → /users?role=admin
```

---

## Request Body Serialization

Cosrx automatically serializes the request body based on the data type:

| Data Type                   | Serialization        | `Content-Type` header                    |
| --------------------------- | -------------------- | ---------------------------------------- |
| Plain object / array        | `JSON.stringify`     | `application/json`                       |
| `FormData`                  | Sent as-is           | Removed (browser sets it with boundary)  |
| `URLSearchParams`           | Sent as-is           | Removed (browser sets it)                |
| `Blob`                      | Sent as-is           | Removed (browser sets it)                |
| `ArrayBuffer` / typed array | Sent as-is           | Not modified                             |
| `string`                    | Sent as-is           | Not modified                             |

```ts
// JSON — automatic
api.post("/users", { name: "Vinod", role: "admin" });

// FormData
const form = new FormData();
form.append("avatar", file);
api.post("/upload", form);

// URLSearchParams
const params = new URLSearchParams({ grant_type: "password" });
api.post("/oauth/token", params);

// Typed array
const buffer = new Uint8Array([1, 2, 3]).buffer;
api.post("/binary", buffer);

// Raw string
api.post("/raw", "plain text body");
```

**Note:** For `FormData` and `URLSearchParams`, Cosrx removes any existing `Content-Type` header so the browser or runtime can set the correct value (including multipart boundary) automatically.

---

## Response Structure

All methods resolve with a `CosrxRes` object:

```ts
interface CosrxRes<T = unknown> {
  data: T;               // Parsed response body
  status: number;        // HTTP status code
  statusText: string;    // HTTP status text
  headers: Headers;      // Native Headers object
  config: CosrxConfig;   // The config used for the request
  rawResponse: Response; // The original fetch Response
}
```

```ts
const res = await api.get<User>("/users/1");

console.log(res.data);                          // User object
console.log(res.status);                        // 200
console.log(res.statusText);                    // "OK"
console.log(res.headers.get("content-type"));   // "application/json"
console.log(res.rawResponse);                   // native Response
```

---

## Response Types

Control how the response body is parsed with `responseType`:

```ts
// JSON (explicit)
const res = await api.get("/data", { responseType: "json" });

// Plain text
const res = await api.get("/readme", { responseType: "text" });

// Blob (file downloads)
const res = await api.get<Blob>("/image.png", { responseType: "blob" });
const url = URL.createObjectURL(res.data);

// ArrayBuffer (binary processing)
const res = await api.get<ArrayBuffer>("/binary", { responseType: "arrayBuffer" });

// ReadableStream
const res = await api.get("/stream", { responseType: "stream" });
const reader = (res.data as ReadableStream).getReader();

// auto (default)
// Inspects Content-Type: parses as JSON if application/json, otherwise as text
const res = await api.get("/anything");
```

---

## Interceptors

Interceptors let you transform requests before they are sent and transform or handle responses before they reach your code.

### Request interceptors

Interceptors run in reverse order of registration (last registered, first executed).

```ts
const id = api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${getAccessToken()}`,
    "X-Request-Time": Date.now().toString(),
  };
  return config;
});
```

### Response interceptors

Response interceptors run in the order they were registered.

```ts
api.interceptors.response.use(
  (res) => {
    // Transform successful responses
    return res;
  },
  (err) => {
    // Handle or rethrow errors
    console.error("Response error:", err);
    throw err;
  },
);
```

### Ejecting an interceptor

`use()` returns a numeric ID that can be used to remove the interceptor later:

```ts
const requestInterceptorId = api.interceptors.request.use((config) => {
  config.headers = { ...config.headers, "X-Debug": "true" };
  return config;
});

// Remove just this interceptor
api.interceptors.request.eject(requestInterceptorId);
```

### Clearing all interceptors

```ts
api.interceptors.request.clear();
api.interceptors.response.clear();
```

### Refresh token pattern

A safe implementation that avoids infinite retry loops:

```ts
import { isCosrxError } from "@cosrx/core";

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (isCosrxError(err) && err.status === 401 && !err.config?._retry) {
      err.config._retry = true;
      await refreshAccessToken();
      return api.request(err.config);
    }
    throw err;
  },
);
```

---

## Retry

Cosrx has a built-in retry mechanism with support for fixed delay, exponential backoff, and jitter.

```ts
api.get("/unstable-endpoint", {
  retry: {
    times: 3,
    delay: 300,
    backoff: "exponential",
    jitter: true,
    on: [408, 429, 500, 502, 503, 504],
  },
});
```

### Retry configuration

```ts
interface RetryConfig {
  times: number;                      // Number of retry attempts (required)
  delay?: number;                     // Base delay in ms (default: 300)
  backoff?: "exponential" | "fixed";  // Delay growth strategy (default: exponential)
  jitter?: boolean;                   // Randomize delay ±25% (default: true)
  on?: number[];                      // HTTP status codes to retry on
}
```

### Defaults

| Option    | Default                          |
| --------- | -------------------------------- |
| `delay`   | `300` ms                         |
| `backoff` | `"exponential"`                  |
| `jitter`  | `true`                           |
| `on`      | `[408, 429, 500, 502, 503, 504]` |

### Backoff behavior

With `backoff: "exponential"` and `delay: 300`:

| Attempt | Base delay | With jitter (approx.) |
| ------- | ---------- | --------------------- |
| 1       | 300 ms     | 225 – 450 ms          |
| 2       | 600 ms     | 450 – 900 ms          |
| 3       | 1200 ms    | 900 – 1800 ms         |

With `backoff: "fixed"` and `delay: 300`, every retry waits exactly 300 ms (with ±25% jitter if `jitter` is `true`).

### Retries are automatically skipped for:

- Requests that were aborted or cancelled
- Status codes not in the `on` list
- Network errors with no response are retried by default

### Disabling retry per-request

Pass `retry: false` to opt out on a specific request, even if a default is configured on the instance:

```ts
api.get("/no-retry", { retry: false });
```

---

## Timeout

Timeouts are implemented with `AbortController` internally. A timed-out request throws a `CosrxError` with `message: "Request aborted"`.

```ts
// Instance-level default
const api = cosrx.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
});

// Per-request override
await api.get("/slow", { timeout: 10000 });

// Disable timeout for one request
await api.get("/long-poll", { timeout: 0 });
```

When both `timeout` and `signal` are set, Cosrx combines them internally — whichever fires first cancels the request.

---

## Request Deduplication

When the same request is fired multiple times in quick succession, use `dedupeKey` to abort the previous in-flight request with the same key. Only the latest request survives.

```ts
function searchUsers(query: string) {
  return api.get("/users/search", {
    params: { q: query },
    dedupeKey: "user-search",
  });
}

// Rapid successive calls — only the last one resolves
searchUsers("v");
searchUsers("vi");
searchUsers("vin"); // only this one resolves
```

**Note:** On retry attempts, `dedupeKey` is intentionally stripped so retries do not cancel themselves.

---

## Cancellation

### Using `CancelController`

`CancelController` wraps `AbortController` with a cancel reason and convenience helpers.

```ts
import { CancelController } from "@cosrx/core";

const controller = new CancelController();

api.get("/users", { signal: controller.signal });

// Cancel the request
controller.cancel("User navigated away");

// Inspect state
console.log(controller.isCancelled); // true
console.log(controller.reason);      // "User navigated away"
```

### Checking for cancel errors

Use the static `CancelController.isCancelError()` helper:

```ts
try {
  await api.get("/users", { signal: controller.signal });
} catch (err) {
  if (CancelController.isCancelError(err)) {
    console.log("Request was cancelled");
  }
}
```

Or with `isCosrxError`:

```ts
import { isCosrxError } from "@cosrx/core";

try {
  await api.get("/users", { signal: controller.signal });
} catch (err) {
  if (isCosrxError(err) && err.message === "Request aborted") {
    console.log("Request was cancelled or timed out");
  }
}
```

### Using a native `AbortSignal`

Cosrx accepts any `AbortSignal`:

```ts
// Native AbortController
const ac = new AbortController();
api.get("/users", { signal: ac.signal });
ac.abort();

// AbortSignal.timeout (Node 17.3+ / modern browsers)
api.get("/users", { signal: AbortSignal.timeout(3000) });
```

---

## Custom Status Validation

By default, Cosrx throws for any response where `response.ok` is `false` (status outside 200–299). Override this with `validateStatus`:

```ts
// Treat anything below 500 as success
api.get("/might-404", {
  validateStatus: (status) => status < 500,
});

// Treat only exactly 200 as success
api.get("/strict", {
  validateStatus: (status) => status === 200,
});

// Never throw always resolve
api.get("/always-resolve", {
  validateStatus: () => true,
});
```

---

## Error Handling

Cosrx throws a typed `CosrxError` for all failure cases: HTTP errors, network errors, timeouts, and aborts.

```ts
import { CosrxError, isCosrxError } from "@cosrx/core";

try {
  await api.get("/users");
} catch (err) {
  if (err instanceof CosrxError) {
    console.log(err.message);      // Human-readable error message
    console.log(err.status);       // HTTP status (undefined if no response)
    console.log(err.isHttpError);  // true if a response was received
    console.log(err.response);     // CosrxRes | null
    console.log(err.config);       // The config used for the request
  }
}
```

Using the `isCosrxError` type guard:

```ts
try {
  await api.post("/users", { name: "Vinod" });
} catch (err) {
  if (isCosrxError(err)) {
    if (err.status === 422) {
      console.log("Validation error:", err.response?.data);
    } else if (err.status === 401) {
      redirectToLogin();
    } else if (!err.isHttpError) {
      console.log("Network or abort error:", err.message);
    }
  }
}
```

### Error scenarios

| Scenario                | `err.isHttpError` | `err.status` | `err.message`                        |
| ----------------------- | ----------------- | ------------ | ------------------------------------ |
| HTTP 4xx / 5xx response | `true`            | e.g. `404`   | `"Request failed with status 404"`   |
| Network failure         | `false`           | `undefined`  | `"Network error"`                    |
| Timeout / cancellation  | `false`           | `undefined`  | `"Request aborted"`                  |

---

## Authentication

### Bearer token (per-request)

```ts
api.get("/me", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

### Bearer token via interceptor

```ts
api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${getAccessToken()}`,
  };
  return config;
});
```

### Basic Auth

```ts
const credentials = btoa("username:password");

api.get("/protected", {
  headers: {
    Authorization: `Basic ${credentials}`,
  },
});
```

---

## Cookies

### Same-origin requests (browser)

Cookies are sent automatically no configuration required.

```ts
cosrx.get("/api/me");
```

### Cross-origin requests (browser)

Pass `credentials: "include"`. The server must respond with `Access-Control-Allow-Credentials: true` and a specific (non-wildcard) origin in `Access-Control-Allow-Origin`.

```ts
cosrx.get("https://api.example.com/me", {
  credentials: "include",
});
```

---

## TypeScript

All methods accept a type parameter for the response body:

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

const res = await api.get<User>("/users/1");
// res.data is typed as User

const listRes = await api.get<User[]>("/users");
// listRes.data is typed as User[]

const created = await api.post<User>("/users", { name: "Vinod" });
// created.data is typed as User
```

### Exported types

```ts
import type {
  CosrxConfig,    // Full request configuration interface
  CosrxRes,       // Response structure interface
  CosrxInstance,  // Interface describing a Cosrx instance
  RetryConfig,    // Retry configuration interface
} from "@cosrx/core";
```

---

## Next.js

### Client components

Cookies behave exactly as in the browser. For cross-origin requests, pass `credentials: "include"`:

```ts
"use client";
import cosrx from "@cosrx/core";

const res = await cosrx.get("https://api.example.com/me", {
  credentials: "include",
});
```

### Server components and Route Handlers

Cookies are not forwarded automatically in server-side environments. Forward them manually:

```ts
import { cookies } from "next/headers";
import cosrx from "@cosrx/core";

export async function GET() {
  const res = await cosrx.get("https://api.example.com/me", {
    headers: {
      Cookie: cookies().toString(),
    },
  });
  return Response.json(res.data);
}
```

---

## Default vs Named Export

```ts
import cosrx from "@cosrx/core";     // Default instance with .create() method attached
import { Cosrx } from "@cosrx/core"; // Class for new Cosrx(...) or subclassing
```

The default export is a pre-constructed `Cosrx` instance ready to use without any configuration. `cosrx.create()` creates new isolated instances from it.

---

## Design Philosophy

- **Stay close to Fetch.** Cosrx does not abstract away browser or runtime behavior it extends it.
- **Explicit over implicit.** No hidden auth injection, no silent cookie handling, no magic defaults.
- **No opinionated auth.** You decide how credentials are attached and managed.
- **Small surface area.** Every exported API is intentional and typed.
- **Standards-first.** Built on `fetch`, `AbortController`, `AbortSignal`, and `Headers` all native platform APIs.

---

## License

MIT
