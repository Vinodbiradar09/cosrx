/**
 * 04 — Retry
 * Cosrx retries on transient failures with exponential backoff and jitter.
 * Aborted and client-error responses are never retried.
 */
import cosrx from "@cosrx/core";

// Instance-level retry config

const api = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  retry: {
    times: 3,
    delay: 200,
    backoff: "exponential",
    jitter: true,
    on: [408, 429, 500, 502, 503, 504],
  },
});

// This request will retry up to 3 times on the configured status codes
const post = await api.get("/posts/1");
console.log("Post fetched (with retry configured):", post.data);

// Per-request override
// More aggressive retry for this specific endpoint

const criticalData = await api.get("/posts/2", {
  retry: {
    times: 5,
    delay: 100,
    backoff: "fixed", // same wait between each attempt
    jitter: false,
  },
});
console.log("Critical data:", criticalData.data);

// Disable retry for mutations
// Never retry POST/PUT/PATCH/DELETE - side effects must not be duplicated

const payment = await api.post(
  "/posts",
  { title: "payment", body: "do not retry this", userId: 1 },
  { retry: false }, // opt out explicitly
);
console.log("Payment created (no retry):", payment.status);

// Fixed backoff example
const polled = await api.get("/posts/3", {
  retry: {
    times: 2,
    delay: 300,
    backoff: "fixed",
    jitter: false,
    // Only retry on gateway errors
    on: [502, 503, 504],
  },
});
console.log("Polled result:", polled.data);
