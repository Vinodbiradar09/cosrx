/**
 * 09 — Error handling
 * All errors are CosrxError instances.
 * HTTP errors carry response + status. Network/timeout errors have null response.
 */
import cosrx, { CosrxError, CancelController, isCosrxError } from "@cosrx/core";

const api = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

// HTTP error (4xx)

try {
  // JSONPlaceholder returns 404 for id > 100
  await api.get("/posts/99999");
} catch (err) {
  if (err instanceof CosrxError) {
    console.log("HTTP error");
    console.log("  message:", err.message); // "Request failed with status 404"
    console.log("  status:", err.status); // 404
    console.log("  isHttpError:", err.isHttpError); // true
    console.log("  response.data:", err.response?.data);
  }
}

// Network error
try {
  await cosrx.get("https://this-domain-does-not-exist-at-all.invalid/api");
} catch (err) {
  if (isCosrxError(err)) {
    console.log("Network error");
    console.log("  isHttpError:", err.isHttpError); // false
    console.log("  status:", err.status); // undefined
    console.log("  message:", err.message);
  }
}

// Timeout

try {
  // 1ms timeout — will always abort
  await api.get("/posts", { timeout: 1 });
} catch (err) {
  if (isCosrxError(err)) {
    console.log("Timeout error");
    console.log("  message:", err.message); // "Request aborted"
    console.log("  isHttpError:", err.isHttpError); // false
  }
}

// Cancellation

const cc = new CancelController();
setTimeout(() => cc.cancel("user left"), 1);

try {
  await api.get("/posts", { signal: cc.signal });
} catch (err) {
  if (CancelController.isCancelError(err)) {
    console.log("Cancelled:", cc.reason); // "user left"
  }
}

// validateStatus — custom success range

// Treat 404 as success — useful for "check if exists" patterns
const res = await api.get("/posts/99999", {
  validateStatus: (s) => s === 200 || s === 404,
});
console.log("404 treated as success, status:", res.status);

// isCosrxError type guard

async function fetchUser(id: number) {
  try {
    const res = await api.get(`/users/${id}`);
    return res.data;
  } catch (err) {
    if (isCosrxError(err)) {
      if (err.status === 404) return null; // not found — ok
      if (!err.isHttpError) throw err; // network issue — rethrow
      console.error(`HTTP ${err.status}:`, err.message);
    }
    throw err;
  }
}

const user = await fetchUser(1);
console.log("fetchUser(1):", user !== null ? "found" : "not found");

const missing = await fetchUser(99999);
console.log(
  "fetchUser(99999):",
  missing === null ? "not found (handled)" : "found",
);
