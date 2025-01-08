import { Logger } from '@medishn/logger';
import { Options } from '@medishn/logger/dist/types';
export class Glogger extends Logger {
  constructor(opts?: Options) {
    super(opts);
  }
}
