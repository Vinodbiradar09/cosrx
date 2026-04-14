/**
 * 03 — Interceptors
 * Request interceptors mutate config before dispatch (LIFO order).
 * Response interceptors transform responses or handle errors (FIFO order).
 */

import cosrx, { isCosrxError } from "@cosrx/core";
import type { CosrxConfig } from "@cosrx/core";

const api = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

// Request interceptors

// Add auth token to every request
const authId = api.interceptors.request.use((config: CosrxConfig) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: "Bearer demo-token-123",
    },
  };
});

// Add request timing header
api.interceptors.request.use((config: CosrxConfig) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Request-Time": Date.now().toString(),
    },
  };
});

// Response interceptors

// Log every response

api.interceptors.response.use((res) => {
  console.log(`[response] ${res.status} — ${res.rawResponse.url}`);
  return res;
});

// Normalise all data into a wrapper shape
api.interceptors.response.use((res) => {
  return {
    ...res,
    data: { payload: res.data, fetchedAt: new Date().toISOString() },
  };
});

const result = await api.get("/posts/1");
console.log("Wrapped data:", result.data);

// Ejecting an interceptor

// Remove the auth interceptor subsequent requests won't have the token
api.interceptors.request.eject(authId);
console.log("Auth interceptor ejected");

// Clearing all interceptors

api.interceptors.request.clear();
api.interceptors.response.clear();
console.log("All interceptors cleared");

// Error interceptor refresh token pattern

const secureApi = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

secureApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (isCosrxError(err) && err.status === 401) {
      console.log("Would refresh token here and retry...");
      // In real code: await refreshToken(); return secureApi.request(err.config);
    }
    throw err;
  },
);

// This will succeed (JSONPlaceholder doesn't return 401)
const ok = await secureApi.get("/posts/1");
console.log("Secure request OK:", ok.status);
