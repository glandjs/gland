import { SSEStream } from './sse-stream';
import { isBoolean, isNil, isNumber, isObject, isString, isUndefined } from '@medishn/toolkit';
import { Stream } from 'stream';
import { ContentTypeManager } from './managers';
import { RequestContext } from '../context';

export class SendData {
  private chunk: any;
  private contentType: ContentTypeManager;
  private readonly encoding: BufferEncoding = 'utf-8';
  constructor(private readonly request: RequestContext) {
    this.contentType = new ContentTypeManager(request.header);
  }

  /**
   * Process the given response body, set proper headers, and send the response.
   * Handles strings, Buffers, streams, and generic objects.
   */
  process<T extends any = any>(body: T) {
    this.chunk = this.processContentType(body);
    if (isString(this.chunk)) {
      if (!this.contentType.get()) {
        this.contentType.set('text/plain; charset=utf-8');
      }
    } else if (this.chunk instanceof Buffer || this.chunk instanceof Stream) {
      if (!this.contentType.get()) {
        this.contentType.set('application/octet-stream');
      }
    } else {
      if (!this.contentType.get()) {
        this.contentType.set('application/json; charset=utf-8');
      }
    }
    const contentLength = this.calculateLength();
    if (!isUndefined(contentLength)) {
      this.contentType.setLength(contentLength);
    }
    if (this.request.isFresh()) {
      this.request.status = 304;
      return this.request.end();
    }
    if (this.request.status === 204 || this.request.status === 304) {
      this.clearHeaders();
      return this.request.end();
    }

    if (this.request.status === 205) {
      this.contentType.setLength(0);
      this.request.end();
      return;
    }
    return this.reply();
  }

  /**
   * processContentType converts the incoming body into a form suitable for sending,
   * setting a default Content-Type when necessary.
   */
  private processContentType<T>(body: T) {
    if (isString(body)) {
      if (!this.contentType.get()) {
        this.contentType.set('text/html');
      }
      return body;
    } else if (isBoolean(body) || isNumber(body) || isObject(body)) {
      if (isNil(body)) {
        body = null as any;
      } else if (Buffer.isBuffer(body)) {
        if (!this.contentType.get()) {
          this.contentType.set('application/octet-stream');
        }
        return body;
      } else {
        return body;
      }
    } else {
      body = '' as any;
    }
    return body;
  }
  private calculateLength() {
    if (!isUndefined(this.chunk)) {
      if (this.chunk instanceof Buffer) {
        return this.chunk.length;
      } else if (isString(this.chunk)) {
        return Buffer.byteLength(this.chunk, this.encoding);
      } else {
        return Buffer.byteLength(JSON.stringify(this.chunk), this.encoding);
      }
    }
    return undefined;
  }
  private clearHeaders() {
    this.contentType.remove();
    this.contentType.removeLength();
  }
  private reply() {
    if (this.request.method === 'HEAD') {
      this.request.end();
      return;
    }
    if (this.chunk instanceof Buffer) {
      this.request.end(this.chunk);
    } else if (isString(this.chunk)) {
      this.request.end(this.chunk, this.encoding);
    } else if (this.chunk instanceof Stream) {
      this.chunk.pipe(this.request.res);
    } else {
      this.request.end(JSON.stringify(this.chunk), this.encoding);
    }
  }
}
