import { METHODS } from 'http';
import { Gland } from '../types/gland';
import { Logger } from './logger';
const logger = Logger.getInstance({ timestampFormat: 'locale', level: 'info' });
export function getMethod(): Array<string> {
  return (
    METHODS &&
    METHODS.map((m: string) => {
      return m.toLowerCase();
    })
  );
}
export class ServerTools {
  private static logMsg(opts: Gland.ListenOptions): string {
    return opts.path
      ? `Server is running at ${opts.path}`
      : `Server is running at http://${opts.host}:${opts.port}`;
  }
  static listener(
    opts: Gland.ListenOptions,
    listeningListener?: (info: Gland.ListenOptions) => void,
  ) {
    return () => {
      if (listeningListener) {
        listeningListener(opts);
      }
    };
  }
  static log(opts: Gland.ListenOptions) {
    logger.info(ServerTools.logMsg(opts));
  }
}
export class URLParser<T extends object> {
  private url: URL;
  private params: T;
  private queries: Record<string, string>;

  constructor(urlString: string, base: string) {
    this.url = new URL(urlString, base);
    this.params = this.extractParams();
    this.queries = this.extractQueries();
  }

  private extractParams(): T {
    const pathParts = this.url.pathname.split('/').filter(Boolean);
    const params: Partial<T> = {};

    pathParts.forEach((part, index) => {
      params[`param${index + 1}` as keyof T] = part as unknown as T[keyof T];
    });

    return params as T;
  }

  private extractQueries(): Record<string, string> {
    const queries: Record<string, string> = {};
    this.url.searchParams.forEach((value, key) => {
      queries[key] = value;
    });
    return queries;
  }

  getParams(): T {
    return this.params;
  }

  getQueries(): Record<string, string> {
    return this.queries;
  }
}
