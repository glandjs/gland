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
    logger.info(ServerTools.logMsg(opts));
  }
}
type ExtractRouteParams<T extends string> = string extends T
  ? {}
  : T extends `${infer _Start}:${infer Param}/${infer Rest}`
  ? { [k in Param | keyof ExtractRouteParams<Rest>]: string }
  : T extends `${infer _Start}:${infer Param}`
  ? { [k in Param]: string }
  : {};
export class URLParser<T extends string> {
  private url: URL;
  private param: Record<string, string>;
  private query: Record<string, string>;
  private pattern: string;

  constructor(urlString: string, base: string, pattern: T) {
    this.url = new URL(urlString, base);
    this.pattern = pattern;
    this.param = this.extractParams();
    this.query = this.extractQueries();
  }

  private extractParams(): Record<string, string> {
    const pathParts = this.url.pathname.split('/').filter(Boolean);
    const patternParts = this.pattern.split('/').filter(Boolean);
    const params: Record<string, string> = {};

    patternParts.forEach((patternPart, index) => {
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = pathParts[index];
      }
    });

    return params;
  }

  private extractQueries(): Record<string, string> {
    const queries: Record<string, string> = {};
    this.url.searchParams.forEach((value, key) => {
      queries[key] = value;
    });
    return queries;
  }

  get params(): Record<string, string> {
    return this.param;
  }

  get queries(): Record<string, string> {
    return this.query;
  }
}
