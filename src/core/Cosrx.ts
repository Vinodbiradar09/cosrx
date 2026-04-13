import { buildRequestUrl } from "./BuildRequestUrl.js";
import { serializeBody } from "./SerializeBody.js";
import { computeDelay } from "./ComputeDelay.js";
import { Interceptors } from "./Interceptors.js";
import { shouldRetry } from "./ShouldRetry.js";
import { retryDelay } from "./RetryDelay.js";
import {
  CosrxError,
  type BodyMethod,
  type CosrxConfig,
  type CosrxInstance,
  type CosrxRes,
  type InterceptorHandler,
  type NoBodyMethod,
  type RetryConfig,
} from "../types/index.js";

export interface Cosrx extends CosrxInstance {}
export class Cosrx {
  private config: CosrxConfig = {};
  public interceptors = {
    request: new Interceptors<CosrxConfig>(),
    response: new Interceptors<CosrxRes>(),
  };
  private readonly inFlight = new Map<string, AbortController>();

  constructor(config: CosrxConfig = {}) {
    if (config.baseURL !== undefined) {
      let url;
      try {
        url = new URL(config.baseURL);
      } catch {
        throw new CosrxError(
          `Invalid baseURL: "${config.baseURL}". Must be an absolute URL with http or https protocol.`,
          null,
          config,
        );
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new CosrxError(
          `Invalid baseURL: "${config.baseURL}". Protocol must be http or https, got "${url.protocol}".`,
          null,
          config,
        );
      }
    }
    this.config = this.mergeConfig(config, {});
  }

  async request<T = unknown>(
    config: CosrxConfig & { url: string },
  ): Promise<CosrxRes<T>> {
    const mergedConfig = this.mergeConfig(config);
    const chain: Array<InterceptorHandler<any>> = [
      { fulfilled: this.executeWithRetry.bind(this), rejected: undefined },
    ];
    this.interceptors.request.handlers.forEach((h) => {
      if (h) chain.unshift(h);
    });
    this.interceptors.response.handlers.forEach((h) => {
      if (h) chain.push(h);
    });
    let promise: Promise<unknown> = Promise.resolve(mergedConfig);
    for (const { fulfilled, rejected } of chain) {
      promise = promise.then(
        (res) => {
          try {
            return fulfilled(res);
          } catch (err) {
            if (rejected) {
              return rejected(err);
            }
            return Promise.reject(err);
          }
        },
        (err) => {
          if (rejected) return rejected(err);
          return Promise.reject(err);
        },
      );
    }
    return promise as Promise<CosrxRes<T>>;
  }
  private async executeWithRetry(config: CosrxConfig): Promise<CosrxRes> {
    const retryCfg: RetryConfig | false =
      config.retry === false ? false : (config.retry ?? false);
    if (retryCfg === false || retryCfg.times <= 0) {
      return this.dispatchRequest(config);
    }
    const maxRetries = retryCfg.times;
    const signal =
      config.signal instanceof AbortSignal ? config.signal : undefined;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const isLastAttempt = attempt === maxRetries + 1;
      try {
        let dispatchConfig: CosrxConfig;
        if (attempt === 1) {
          dispatchConfig = config;
        } else {
          const { dedupeKey: _dk, ...rest } = config;
          dispatchConfig = rest;
        }
        return await this.dispatchRequest(dispatchConfig);
      } catch (err) {
        if (isLastAttempt || signal?.aborted || !shouldRetry(err, retryCfg)) {
          throw err;
        }
        await retryDelay(computeDelay(retryCfg, attempt), signal);
      }
    }
    throw new CosrxError("Retry loop exited unexpectedly", null, config);
  }
  private async dispatchRequest(config: CosrxConfig): Promise<CosrxRes> {
    const {
      url,
      baseURL,
      params,
      arrayFormat,
      timeout,
      retry: _retry,
      dedupeKey,
      data: _data,
      validateStatus,
      responseType,
      signal: userSignal,
      _deleteHeaders,
      ...nativeConfig
    } = config as any;

    if (_deleteHeaders?.length && nativeConfig.headers) {
      const lower = (_deleteHeaders as string[]).map((h) => h.toLowerCase());
      Object.keys(nativeConfig.headers).forEach((k: string) => {
        if (lower.includes(k.toLowerCase())) {
          delete nativeConfig.headers[k];
        }
      });
    }
    const fullUrl = buildRequestUrl(url ?? "", baseURL, params, arrayFormat);
    const abortController = new AbortController();
    if (dedupeKey) {
      const previous = this.inFlight.get(dedupeKey);
      if (previous) {
        previous.abort();
      }
      this.inFlight.set(dedupeKey, abortController);
    }
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (timeout) timeoutId = setTimeout(() => abortController.abort(), timeout);
    const signal = userSignal
      ? AbortSignal.any([abortController.signal, userSignal])
      : abortController.signal;

    try {
      const response = await fetch(fullUrl.toString(), {
        ...nativeConfig,
        signal,
      });
      const contentType = response.headers.get("content-type");
      let responseData: unknown = null;
      try {
        const rt = responseType ?? "auto";
        if (rt === "stream") responseData = response.body;
        else if (rt === "blob") responseData = await response.blob();
        else if (rt === "arrayBuffer")
          responseData = await response.arrayBuffer();
        else if (rt === "text") responseData = await response.text();
        else if (rt === "json") {
          const t = await response.text();
          responseData = t ? JSON.parse(t) : {};
        } else {
          if (contentType?.includes("application/json")) {
            const t = await response.text();
            responseData = t ? JSON.parse(t) : {};
          } else {
            responseData = await response.text();
          }
        }
      } catch {
        responseData = null;
      }
      const cosrxRes: CosrxRes = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: nativeConfig,
        rawResponse: response,
      };
      const isSuccess = validateStatus
        ? validateStatus(response.status)
        : response.ok;
      if (!isSuccess) {
        throw new CosrxError(
          `Request failed with status ${response.status}`,
          cosrxRes,
          config,
        );
      }
      return cosrxRes;
    } catch (err) {
      if (err instanceof CosrxError) throw err;
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? "Request aborted"
          : err instanceof Error
            ? err.message
            : "Network error";
      throw new CosrxError(message, null, config);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (dedupeKey && this.inFlight.get(dedupeKey) === abortController) {
        this.inFlight.delete(dedupeKey);
      }
    }
  }

  private mergeConfig(
    config: CosrxConfig,
    base: CosrxConfig = this.config,
  ): CosrxConfig {
    return {
      ...base,
      ...config,
      ...(typeof config.timeout !== "undefined"
        ? { timeout: config.timeout }
        : typeof base.timeout !== "undefined"
          ? { timeout: base.timeout }
          : {}),
      ...(typeof config.retry !== "undefined"
        ? { retry: config.retry }
        : typeof base.retry !== "undefined"
          ? { retry: base.retry }
          : {}),
      ...(typeof config.arrayFormat !== "undefined"
        ? { arrayFormat: config.arrayFormat }
        : typeof base.arrayFormat !== "undefined"
          ? { arrayFormat: base.arrayFormat }
          : {}),
      headers: {
        ...(base.headers || {}),
        ...(config.headers || {}),
      },
    };
  }
}

const NO_BODY_METHODS = [
  "get",
  "head",
  "delete",
  "options",
] as const satisfies readonly NoBodyMethod[];

const BODY_METHODS = [
  "post",
  "put",
  "patch",
] as const satisfies readonly BodyMethod[];

type CosrxProto = Cosrx & Record<string, (...args: any[]) => any>;

NO_BODY_METHODS.forEach((method) => {
  (Cosrx.prototype as CosrxProto)[method] = function (
    url: string,
    config: CosrxConfig = {},
  ): Promise<CosrxRes<any>> {
    return this.request({ ...config, url, method: method.toUpperCase() });
  };
});

BODY_METHODS.forEach((method) => {
  (Cosrx.prototype as CosrxProto)[method] = function (
    url: string,
    data?: unknown,
    config: CosrxConfig = {},
  ): Promise<CosrxRes<any>> {
    const raw = data ?? config.data;
    const { body, headers: bodyHeaders, deleteHeaders } = serializeBody(raw);
    const _headers: Record<string, string> = {
      ...bodyHeaders,
      ...(config.headers || {}),
    };
    if (deleteHeaders?.length) {
      const lower = deleteHeaders.map((h) => h.toLowerCase());
      Object.keys(_headers).forEach((k) => {
        if (lower.includes(k.toLowerCase())) {
          delete _headers[k];
        }
      });
    }
    return this.request({
      ...config,
      url,
      headers: _headers,
      method: method.toUpperCase(),
      body,
      _deleteHeaders: deleteHeaders,
    } as any);
  };
});
