/**
 * 08 — Response types
 * responseType controls how the response body is parsed.
 * 'auto' (default) sniffs Content-Type.
 */
import cosrx from "@cosrx/core";

const BASE = "https://jsonplaceholder.typicode.com";

// auto (default) — sniffs Content-Type

const json = await cosrx.get(`${BASE}/posts/1`);
console.log(
  "auto JSON:",
  typeof json.data,
  (json.data as { title: string }).title,
);

//explicit json

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

const explicit = await cosrx.get<Post>(`${BASE}/posts/1`, {
  responseType: "json",
});
console.log("explicit JSON:", explicit.data.title);

// text

const text = await cosrx.get(`${BASE}/posts/1`, { responseType: "text" });
console.log("text (first 60 chars):", (text.data as string).slice(0, 60));

// blob — for file downloads
const blob = await cosrx.get(`${BASE}/posts/1`, { responseType: "blob" });
console.log("blob size:", (blob.data as Blob).size, "bytes");
console.log("blob type:", (blob.data as Blob).type);

// In a browser you would do:
// const url = URL.createObjectURL(blob.data as Blob)
// const a = document.createElement('a')
// a.href = url; a.download = 'data.json'; a.click()

// arrayBuffer — for binary processing

const buf = await cosrx.get(`${BASE}/posts/1`, { responseType: "arrayBuffer" });
console.log("arrayBuffer bytes:", (buf.data as ArrayBuffer).byteLength);

// stream — for large responses

const stream = await cosrx.get(`${BASE}/posts`, { responseType: "stream" });
const reader = (stream.data as ReadableStream<Uint8Array>).getReader();

let chunks = 0;
let done = false;
while (!done) {
  const result = await reader.read();
  done = result.done;
  if (!done) chunks++;
}
console.log(`stream: read ${chunks} chunks`);

// rawResponse — low-level access

const res = await cosrx.get(`${BASE}/posts/1`);
console.log("rawResponse.url:", res.rawResponse.url);
console.log("rawResponse.ok:", res.rawResponse.ok);
console.log("content-type:", res.headers.get("content-type"));
