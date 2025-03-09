import { RequestMethod } from '@gland/common';
import { IncomingMessage, ServerResponse } from 'http';
import { HeadersManager, CookiesManager, SendData, SSEStream } from '../utils/';
import { HttpStatus, isNaNValue } from '@medishn/toolkit';
export class RequestContext {
  public readonly header: HeadersManager;
  private _isSent = false;
  private _isFinished = false;
  constructor(public req: IncomingMessage, public readonly res: ServerResponse) {
    this.header = new HeadersManager(res, req);
  }
  get cookies(): CookiesManager {
    return new CookiesManager(this.header);
  }
  send<T>(body: T): void {
    const sender = new SendData(this);
    sender.process(body);
  }

  redirect(url: string, status: HttpStatus): void {
    this.status = status;
    this.header.set('location', url);
    this.end();
  }

  sse(): SSEStream {
    if (this.isSent || this.isFinished) {
      throw new Error('Response has already been sent');
    }

    // Ensure headers are set for SSE
    this.header.set('content-type', 'text/event-stream');
    this.header.set('cache-control', 'no-cache');
    this.header.set('connection', 'keep-alive');

    return new SSEStream(this.req, this.res);
  }

  get method(): RequestMethod | undefined {
    const method = this.req.method?.toUpperCase();
    if (!method) return undefined;
    if (Object.values(RequestMethod).includes(method as RequestMethod)) {
      return method as RequestMethod;
    }

    return undefined;
  }

  /**
   * Getter and setter for HTTP.
   */
  set status(code: HttpStatus) {
    this.res.statusCode = code;
  }
  get status(): HttpStatus {
    return this.res.statusCode;
  }

  get isSent(): boolean {
    return this._isSent;
  }

  get isFinished(): boolean {
    return this._isFinished;
  }

  end(cb?: () => void): this;
  end(chunk: any, cb?: () => void): this;
  end(chunk: any, encoding: BufferEncoding, cb?: () => void): this;
  end(): any {
    this.res.end(...arguments);
    if (this.res.writableEnded) {
      this._isSent = true;
      this._isFinished = true;
    }
    return;
  }

  isFresh(): boolean {
    const { method, headers } = this.req;
    if (!['GET', 'HEAD'].includes(method!)) {
      return false;
    }
    const ifNoneMatch = headers['if-none-match'];
    const ifModifiedSince = headers['if-modified-since'];
    const etag = this.header.get('etag');
    const lastModified = this.header.get('last-modified');
    if (!ifNoneMatch && !ifModifiedSince) {
      return false;
    }
    if (ifNoneMatch && etag) {
      const clientEtags = ifNoneMatch.split(',').map((tag) => tag.trim());
      if (clientEtags.includes(etag)) {
        return true;
      }
    }

    if (ifModifiedSince && lastModified) {
      const modifiedSinceTime = Date.parse(ifModifiedSince);
      const lastModifiedTime = Date.parse(lastModified);

      if (!isNaNValue(modifiedSinceTime) && !isNaNValue(lastModifiedTime)) {
        if (lastModifiedTime <= modifiedSinceTime) {
          return true;
        }
      }
    }

    return false;
  }
}
