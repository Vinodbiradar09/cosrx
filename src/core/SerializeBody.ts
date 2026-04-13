import type { SerializedBody } from "../types/index.js";

function serializeBody(data: unknown): SerializedBody {
  if (data === null || data === undefined) {
    return { body: null, headers: {} };
  }

  if (data instanceof FormData) {
    return { body: data, headers: {}, deleteHeaders: ["Content-Type"] };
  }

  if (data instanceof URLSearchParams) {
    return { body: data, headers: {}, deleteHeaders: ["Content-Type"] };
  }

  if (data instanceof Blob) {
    return { body: data, headers: {}, deleteHeaders: ["Content-Type"] };
  }

  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return { body: data as BodyInit, headers: {} };
  }

  if (typeof data === "string") {
    return { body: data, headers: {} };
  }

  return {
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  };
}

export { serializeBody };
