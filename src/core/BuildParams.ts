import type { CosrxConfig, ParamValue } from "../types/index.js";

function buildParams(
  params: NonNullable<CosrxConfig["params"]>,
  arrayFormat: NonNullable<CosrxConfig["arrayFormat"]>,
  url: URL,
): void {
  function append(key: string, value: ParamValue): void {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      if (arrayFormat === "comma") {
        url.searchParams.append(key, value.map(String).join(","));
      } else if (arrayFormat === "bracket") {
        value.forEach((v) => url.searchParams.append(`${key}[]`, String(v)));
      } else {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      }
    } else if (typeof value === "object") {
      Object.entries(value).forEach(([k, v]) =>
        append(`${key}.${k}`, v as ParamValue),
      );
    } else {
      url.searchParams.append(key, String(value));
    }
  }
  Object.entries(params).forEach(([k, v]) => append(k, v as ParamValue));
}

export { buildParams };
