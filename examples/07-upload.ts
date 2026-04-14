/**
 * 07 — File upload
 * Cosrx detects FormData, Blob, and URLSearchParams automatically.
 * Content-Type is never set manually for these the browser/runtime
 * sets it with the correct multipart boundary.
 */
import cosrx from "@cosrx/core";

const api = cosrx.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  // Even though this instance has Content-Type: application/json set globally,
  // Cosrx strips it automatically when the body is FormData or URLSearchParams.
  headers: {
    "Content-Type": "application/json",
  },
});

// FormData upload
const form = new FormData();
form.append("title", "My Upload");
form.append("userId", "1");
// In a real app: form.append("file", fileInput.files[0])

const uploaded = await api.post("/posts", form);
// Content-Type is NOT application/json here — cosrx removed the instance header
// so the runtime can set multipart/form-data with the correct boundary
console.log("FormData upload:", uploaded.status);

// URLSearchParams
// Useful for OAuth token endpoints and form submissions

const params = new URLSearchParams({
  grant_type: "password",
  username: "user@example.com",
  password: "secret",
});

// In a real OAuth flow this would go to your token endpoint
const tokenReq = await api.post("/posts", params);
// Content-Type: application/x-www-form-urlencoded — set by the browser
console.log("URLSearchParams:", tokenReq.status);

// Blob

const blob = new Blob([JSON.stringify({ key: "value" })], {
  type: "application/json",
});

const blobReq = await api.post("/posts", blob);
console.log("Blob upload:", blobReq.status);

// Binary data

const buffer = new Uint8Array([137, 80, 78, 71]).buffer; // PNG magic bytes
const binReq = await api.post("/posts", buffer);
console.log("Binary upload:", binReq.status);

// Plain string
const xmlReq = await api.post("/posts", "<root><item>value</item></root>", {
  headers: { "Content-Type": "application/xml" },
});
console.log("XML string upload:", xmlReq.status);
