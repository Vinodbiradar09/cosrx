/**
 * 05 — Cancellation
 * CancelController wraps AbortController with a reason string and helpers.
 * Any AbortSignal is also accepted directly.
 */
import cosrx, { CancelController, isCosrxError } from "@cosrx/core";

const api = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

// Basic cancellation

const controller = new CancelController();

// Start the request
const req = api.get("/posts", { signal: controller.signal });

// Cancel after 1ms (before the response arrives in most environments)

setTimeout(() => controller.cancel("User navigated away"), 1);

try {
  await req;
} catch (err) {
  if (CancelController.isCancelError(err)) {
    console.log("Request cancelled:", controller.reason);
    // → "User navigated away"
  }
}

// Inspect state
console.log("isCancelled:", controller.isCancelled); // true
console.log("reason:", controller.reason); // "User navigated away"

// Cancel is idempotent
controller.cancel("second call ignored");
console.log("reason still:", controller.reason); // still "User navigated away"

// One controller, multiple requests

const multi = new CancelController();

const [r1, r2, r3] = await Promise.allSettled([
  api.get("/posts/1", { signal: multi.signal }),
  api.get("/posts/2", { signal: multi.signal }),
  api.get("/posts/3", { signal: multi.signal }),
]);

multi.cancel("batch cancelled");

console.log("r1:", r1.status); // fulfilled or rejected depending on timing
console.log("r2:", r2.status);
console.log("r3:", r3.status);

// Native AbortSignal

const ac = new AbortController();
setTimeout(() => ac.abort(), 1);

try {
  await api.get("/posts", { signal: ac.signal });
} catch (err) {
  if (isCosrxError(err) && err.message === "Request aborted") {
    console.log("Native AbortController also works");
  }
}

// AbortSignal.timeout

try {
  await api.get("/posts", { signal: AbortSignal.timeout(1) });
} catch (err) {
  if (isCosrxError(err)) {
    console.log("AbortSignal.timeout worked:", err.message);
  }
}
