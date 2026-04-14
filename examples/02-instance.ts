/**
 * 02 — Instance creation
 * cosrx.create() produces an isolated instance with its own
 * baseURL, headers, timeout, retry config, and interceptor stack.
 * Multiple instances never share state.
 */

import cosrx from "@cosrx/core";

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Create a scoped instance for the JSONPlaceholder API
const api = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
    "X-App-Name": "cosrx-example",
  },
});

// All paths are now relative to baseURL
const post = await api.get<Post>("/posts/1");
console.log("Post title:", post.data.title);

const user = await api.get<User>("/users/1");
console.log("User name:", user.data.name);

// Per-request config merges with instance config
// per-request headers override instance headers

const posts = await api.get<Post[]>("/posts", {
  params: { userId: 1 },
  headers: { "X-Request-ID": crypto.randomUUID() },
});
console.log(`Posts by user 1: ${posts.data.length}`);

// Two independent instances — different baseURLs, separate interceptor stacks
const publicApi = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});
const internalApi = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  headers: { Authorization: "Bearer internal-token" },
});

const [pub, internal] = await Promise.all([
  publicApi.get<Post>("/posts/1"),
  internalApi.get<Post>("/posts/2"),
]);
console.log("Public:", pub.data.id, "Internal:", internal.data.id);
