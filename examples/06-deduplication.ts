/**
 * 06 — Request deduplication
 * When the same dedupeKey fires multiple times, only the latest survives.
 * Previous in-flight requests are aborted automatically.
 * Critical pattern for search inputs and polling.
 */
import cosrx, { CancelController, isCosrxError } from "@cosrx/core";

const api = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

// Search input pattern

async function searchPosts(query: string) {
  return api.get("/posts", {
    params: { userId: query },
    dedupeKey: "post-search",
  });
}

// Simulate rapid keystrokes only the last one should resolve
const results = await Promise.allSettled([
  searchPosts("1"),
  searchPosts("2"),
  searchPosts("3"), // ← only this one resolves
]);

results.forEach((r, i) => {
  if (r.status === "fulfilled") {
    console.log(`Search ${i + 1}: resolved`);
  } else {
    const wasCancelled = CancelController.isCancelError(r.reason);
    console.log(
      `Search ${i + 1}: ${wasCancelled ? "cancelled (superseded)" : "failed"}`,
    );
  }
});

// Polling pattern
// Only one poll in-flight at a time if the interval fires again
// before the previous completes, the previous is aborted.

let pollCount = 0;

async function pollStatus() {
  try {
    const res = await api.get("/posts/1", { dedupeKey: "status-poll" });
    console.log(`Poll ${++pollCount} resolved:`, res.status);
  } catch (err) {
    if (CancelController.isCancelError(err)) {
      console.log(`Poll superseded by newer request`);
    }
  }
}

// Fire three overlapping polls
await Promise.allSettled([pollStatus(), pollStatus(), pollStatus()]);

// Different keys don't interfere

const [comments, users] = await Promise.all([
  api.get("/comments/1", { dedupeKey: "comments" }),
  api.get("/users/1", { dedupeKey: "users" }),
]);
console.log("Both resolved independently:", comments.status, users.status);
