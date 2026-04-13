import type { CosrxConfig } from "../types/index.js";
import { buildParams } from "./BuildParams.js";

function buildRequestUrl(
  url: string,
  baseURL: string | undefined,
  params: CosrxConfig["params"],
  arrayFormat: CosrxConfig["arrayFormat"],
): URL {
  let fullUrl: URL;
  try {
    fullUrl = new URL(url);
  } catch {
    if (baseURL) {
      const normalBase = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
      const relativePath = url.startsWith("/") ? url.slice(1) : url;
      fullUrl = new URL(relativePath, normalBase);
    } else {
      fullUrl = new URL(url);
    }
  }
  if (params) {
    buildParams(params, arrayFormat ?? "repeat", fullUrl);
  }

  return fullUrl;
}

export { buildRequestUrl };
