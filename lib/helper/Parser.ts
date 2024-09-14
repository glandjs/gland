import { IncomingMessage } from 'http';
import { TLSSocket } from 'tls';

export namespace Parser {
  export class URI<T extends string = string> {
    private readonly url: URL;
    private readonly paramsMap: Record<string, string>;
    private readonly queriesMap: Record<string, string>;

    constructor(urlString: string, base: string, pattern: T) {
      this.url = new URL(urlString, base);
      this.paramsMap = this.extractParams(pattern);
      this.queriesMap = this.extractQueries();
    }

    private extractParams(pattern: T): Record<string, string> {
      const pathParts = this.url.pathname.split('/').filter(Boolean);
      const patternParts = pattern.split('/').filter(Boolean);
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

    public get params(): Record<string, string> {
      return this.paramsMap;
    }

    public get queries(): Record<string, string> {
      return this.queriesMap;
    }
  }
  export async function Request(req: IncomingMessage): Promise<{ base: string; url: URL; method: string; protocol: string; host: string; path: string }> {
    if (!req.url) {
      throw new Error('Request URL is missing.');
    }
    if (!req.headers) {
      throw new Error('Request header is missing.');
    }
    if (!req.headers.host) {
      throw new Error('Request host header is missing.');
    }

    const protocol = req.socket instanceof TLSSocket ? 'https' : 'http';
    const base = `${protocol}://${req.headers.host}`;
    const url = new URL(req.url, base);

    return {
      url,
      method: req.method || 'GET',
      protocol,
      host: req.headers.host,
      path: url.pathname,
      base,
    };
  }
}
