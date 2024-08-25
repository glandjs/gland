import { METHODS } from 'http';
import { Gland } from '../types';
import { Logger } from './logger';
import { MidsFn } from '../types';
import { extname } from 'path';
export namespace ServerUtils {
  const logger = Logger.getInstance({ timestampFormat: 'locale', level: 'info' });
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
      logger.info(Tools.logMsg(opts));
    }
  }
  export function normalize(middleware: MidsFn | MidsFn[]): MidsFn[] {
    return Array.isArray(middleware) ? middleware : [middleware];
  }
  export function generateETag(stat: any): string {
    const mtime = stat.mtime.getTime().toString(16);
    const size = stat.size.toString(16);
    return `W/"${size}-${mtime}"`;
  }

  export function getContentType(filePath: string): string {
    const ext = extname(filePath).slice(1);
    switch (ext) {
      case 'html':
        return 'text/html';
      case 'css':
        return 'text/css';
      case 'js':
        return 'application/javascript';
      case 'png':
        return 'image/png';
      case 'jpg':
        return 'image/jpeg';
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      case 'json':
        return 'application/json';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }
}
