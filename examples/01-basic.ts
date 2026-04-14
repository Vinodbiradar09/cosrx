/**
 * 01 — Basic usage
 * The default cosrx instance works out of the box.
 * No configuration needed for simple requests.
 */
import cosrx, { isCosrxError } from "@cosrx/core";

// GET — fetch a single resource
const user = await cosrx.get("https://jsonplaceholder.typicode.com/users/1");
console.log("User:", user.data);
console.log("Status:", user.status);

// GET — fetch a list
const posts = await cosrx.get("https://jsonplaceholder.typicode.com/posts", {
  params: { userId: 1 },
});
console.log(`Posts for user 1: ${(posts.data as unknown[]).length} items`);

// POST
const created = await cosrx.post("https://jsonplaceholder.typicode.com/posts", {
  title: "Hello Cosrx",
  body: "This is my first post",
  userId: 1,
});
console.log("Created post:", created.data);
console.log("Created status:", created.status); // 201

// PUT
const updated = await cosrx.put(
  "https://jsonplaceholder.typicode.com/posts/1",
  {
    id: 1,
    title: "Updated Title",
    body: "Updated body",
    userId: 1,
  },
);
console.log("Updated:", (updated.data as { title: string }).title);

// PATCH
const patched = await cosrx.patch(
  "https://jsonplaceholder.typicode.com/posts/1",
  {
    title: "Patched Title",
  },
);
console.log("Patched:", (patched.data as { title: string }).title);

// DELETE
const deleted = await cosrx.delete(
  "https://jsonplaceholder.typicode.com/posts/1",
);
console.log("Delete status:", deleted.status); // 200
