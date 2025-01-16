import { IncomingMessage, ServerResponse } from 'http';
import { Stream } from 'stream';
import { calculateContentLength, handleContentType, setContentTypeForString, cleanHeaders, handleResetContent, handleETag, isFresh, extractLang } from '../utils';
import { ResponseBody, ServerRequest } from '../common/interfaces';
import { HttpStatus } from '../common/enums';

export class Context {
  public ctx: ServerRequest;
  constructor(public req: IncomingMessage, public res: ServerResponse) {
    this.ctx = {} as ServerRequest;
    this.ctx.req = req;
    this.ctx.res = res;
    this.ctx.send = this.send.bind(this);
    this.ctx.status = this.status;
    this.ctx.language = this.lang;
    this.ctx.redirect = this.redirect.bind(this);
  }
  get status() {
    return this.ctx.res.statusCode;
  }
  set status(code: HttpStatus) {
    this.ctx.res.statusCode = code;
    this.ctx.status = code;
  }
  get lang(): string {
    return this.ctx.language;
  }
  set lang(defaultLang: string) {
    const headerLang = this.ctx.req.headers?.['accept-language'];
    const lang = extractLang(headerLang || defaultLang);
    this.ctx.language = lang;
  }
  send<T = any>(body: ResponseBody<T>): void {
    let encoding: BufferEncoding = 'utf8';
    const req = this.req;
    const res = this.res;
    try {
      let chunk: ResponseBody<T> = handleContentType(body, res);

      if (typeof chunk === 'string') {
        encoding = 'utf8';
        setContentTypeForString(res);
      } else if (Buffer.isBuffer(chunk)) {
        if (!res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', 'application/octet-stream');
        }
      } else if (chunk instanceof Stream) {
        if (!res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', 'application/octet-stream');
        }
      } else {
        if (!res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
      }

      let len: number | undefined = calculateContentLength(chunk, encoding);
      if (len !== undefined) {
        if (!this.ctx.bodySize) {
          this.ctx.bodySize = len;
        }
        res.setHeader('Content-Length', this.ctx.bodySize ?? len);
      }
      handleETag(this.ctx, chunk, len, res);

      if (isFresh(req, res)) {
        res.statusCode = 304;
        res.end();
        return;
      }
      if (this.status === 204 || this.status === 304) {
        cleanHeaders(res);
        res.end();
        return;
      }

      if (this.status === 205) {
        handleResetContent(res);
        res.end();
        return;
      }

      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      if (Buffer.isBuffer(chunk)) {
        res.end(chunk);
      } else if (typeof chunk === 'string') {
        res.end(chunk, encoding);
      } else if (chunk instanceof Stream) {
        chunk.pipe(res);
      } else {
        res.end(JSON.stringify(chunk), encoding);
      }
    } catch (error: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          status: 'error',
          message: 'Internal Server Error',
          statusCode: 500,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        }),
        encoding,
      );
    }
  }
  redirect(url: string, status: HttpStatus = HttpStatus.MOVED_PERMANENTLY): void {
    this.status = status;
    this.res.setHeader('Location', url);
    this.res.end();
  }
}
