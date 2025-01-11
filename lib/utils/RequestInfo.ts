import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http';
import { ServerRequest } from '../types';
import { TLSSocket } from 'tls';

export class RequestInfo {
  private req: IncomingMessage;
  private res: ServerResponse;

  constructor(private ctx: ServerRequest) {
    this.req = ctx.req;
    this.res = ctx.res;
  }
  get body() {
    return this.ctx.body;
  }

  get bodySize(): string {
    const bodySize = this.res.getHeader('content-length');
    return bodySize ? bodySize.toString() : '0';
  }

  get bodyRaw(): Buffer {
    return this.ctx.bodyRaw;
  }

  get statusCodeClass(): '1xx' | '2xx' | '3xx' | '4xx' | '5xx' | 'Unknown' {
    const statusCode = this.res.statusCode;
    if (statusCode >= 100 && statusCode < 200) return '1xx';
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    if (statusCode >= 500 && statusCode < 600) return '5xx';
    return 'Unknown';
  }

  get method(): string {
    return this.req.method || '';
  }

  get url(): string {
    return this.req.url || '';
  }

  get cookies(): Record<string, string> {
    const cookiesHeader = this.req.headers?.['cookie'];
    const cookies: Record<string, string> = {};

    if (cookiesHeader) {
      const cookiePairs = cookiesHeader.split(';');
      cookiePairs.forEach((cookiePair) => {
        const [key, value] = cookiePair.split('=').map((part) => part.trim());
        if (key && value) {
          cookies[key] = value;
        }
      });
    }

    return cookies;
  }

  get protocol(): string {
    if (this.req.socket instanceof TLSSocket && this.req.socket.encrypted) {
      return 'https';
    } else {
      return 'http';
    }
  }

  get ip(): string {
    const xff = this.req.headers['x-forwarded-for'];
    if (xff) {
      const ips = (xff as string).split(',');
      return ips[0].trim();
    }
    return this.req.socket.remoteAddress || '';
  }

  get headers(): IncomingHttpHeaders {
    return this.req.headers;
  }

  get userAgent(): string {
    return this.req.headers?.['user-agent'] || '';
  }

  get referer(): string {
    return this.req.headers?.['referer'] || '';
  }

  get acceptedLanguages(): string {
    return this.req.headers?.['accept-language'] || '';
  }
}
