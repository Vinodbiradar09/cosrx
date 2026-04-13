import { CancelController } from "./core/CancelController.js";
import { CosrxError, isCosrxError } from "./types/index.js";
import { Cosrx } from "./core/Cosrx.js";
import type {
  CosrxConfig,
  CosrxRes,
  CosrxInstance,
  RetryConfig,
} from "./types/index.js";

const cosrx = Object.assign(new Cosrx({}), {
  create(config: CosrxConfig = {}): Cosrx {
    return new Cosrx(config);
  },
});

export { cosrx, Cosrx, CosrxError, CancelController, isCosrxError };
export type { CosrxConfig, CosrxRes, CosrxInstance, RetryConfig };
export default cosrx;
