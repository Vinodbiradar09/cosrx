import { RETRY_DEFAULT_DELAY, type RetryConfig } from "../types/index.js";
function computeDelay(cfg: RetryConfig, attempt: number): number {
  const base = cfg.delay ?? RETRY_DEFAULT_DELAY;
  const raw = cfg.backoff === "fixed" ? base : base * Math.pow(2, attempt - 1);
  if (cfg.jitter === false) return raw;
  return raw * (0.75 + Math.random() * 0.5);
}

export { computeDelay };
