import { METHODS } from 'http';
import { Gland } from '../types';
import { MidsFn } from '../types';
import { Factory } from '@medishn/gland-logger';
const logger = new Factory({ timestampFormat: 'locale', level: 'info' });
export namespace ServerUtils {
  export function getMethod(): Array<string> {
    return (
      METHODS &&
      METHODS.map((m: string) => {
        return m.toLowerCase();
      })
    );
  }

  export class Tools {
    private static logMsg(opts: Gland.ListenOptions): string {
      return opts.path ? `Server is running at ${opts.path}` : `Server is running at http://${opts.host}:${opts.port}`;
    }
    static listener(opts: Gland.ListenOptions, listeningListener?: (info: Gland.ListenOptions) => void) {
      return () => {
        if (listeningListener) {
          listeningListener(opts);
        }
      };
    }
    static log(opts: Gland.ListenOptions) {
      logger.log(Tools.logMsg(opts), 'info');
    }
  }
  export function normalize(middleware: MidsFn | MidsFn[]): MidsFn[] {
    return Array.isArray(middleware) ? middleware : [middleware];
  }
}
