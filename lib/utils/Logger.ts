import { Logger } from '@medishn/logger';
import { Options } from '@medishn/logger/dist/types';
class Glogger extends Logger {
  constructor(opts?: Options) {
    super(opts);
  }
}
export const GLogger = new Glogger();
