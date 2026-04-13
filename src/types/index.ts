export interface RetryConfig {
  times: number;
  delay?: number;
  on?: number[];
  backoff?: "exponential" | "fixed";
  jitter?: boolean;
}

export interface CosrxConfig extends RequestInit {
  url?: string;
  baseURL?: string;
  timeout?: number;
  params?: Record<
    string,
    | string
    | number
    | boolean
    | null
    | undefined
    | string[]
    | number[]
    | boolean[]
    | Record<string, string | number | boolean | null | undefined>
  >;
  arrayFormat?: "repeat" | "comma" | "bracket";
  headers?: Record<string, string>;
  data?: unknown;
  dedupeKey?: string;
  retry?: RetryConfig | false;
  validateStatus?: (status: number) => boolean;
  responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream" | "auto";
}

export interface CosrxRes<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: CosrxConfig;
  rawResponse: Response;
}

export interface InterceptorHandler<V> {
  fulfilled: (value: V) => V | Promise<V>;
  rejected?: ((error: unknown) => unknown) | undefined;
}

export class CosrxError<T = unknown> extends Error {
  constructor(
    message: string,
    public readonly response: CosrxRes<T> | null,
    public readonly config: CosrxConfig,
  ) {
    super(message);
    this.name = "CosrxError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
  get isHttpError(): boolean {
    return this.response !== null;
  }
  get status(): number | undefined {
    return this.response?.status;
  }
}

export interface CosrxInstance {
  get<T = unknown>(url: string, config?: CosrxConfig): Promise<CosrxRes<T>>;
  head<T = unknown>(url: string, config?: CosrxConfig): Promise<CosrxRes<T>>;
  delete<T = unknown>(url: string, config?: CosrxConfig): Promise<CosrxRes<T>>;
  options<T = unknown>(url: string, config?: CosrxConfig): Promise<CosrxRes<T>>;
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: CosrxConfig,
  ): Promise<CosrxRes<T>>;
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: CosrxConfig,
  ): Promise<CosrxRes<T>>;
  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: CosrxConfig,
  ): Promise<CosrxRes<T>>;
}

export type ParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[]
  | number[]
  | boolean[]
  | Record<string, string | number | boolean | null | undefined>;

export function isCosrxError(err: unknown): err is CosrxError {
  return err instanceof CosrxError;
}
export type NoBodyMethod = "get" | "head" | "delete" | "options";
export type BodyMethod = "post" | "put" | "patch";

export const RETRY_DEFAULT_DELAY = 300;
export const RETRY_DEFAULT_ON = [408, 429, 500, 502, 503, 504];
export type SerializedBody = {
  body: BodyInit | null;
  headers: Record<string, string>;
  deleteHeaders?: string[];
};
