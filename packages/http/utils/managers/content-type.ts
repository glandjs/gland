import { isNil, isNumber, isString, isTruthy, Maybe } from '@medishn/toolkit';
import { HttpHeaders, HttpHeaderValue } from 'packages/http/interface';

export class ContentTypeManager {
  constructor(private header: HttpHeaders) {}

  set<V extends string>(type: HttpHeaderValue<'content-type', V>, charset?: BufferEncoding): void {
    const contentType = isTruthy(charset) ? `${type}; charset=${charset}` : type;
    this.header.set<'content-type', V>('content-type', contentType as HttpHeaderValue<'content-type', V>);
  }
  get(): Maybe<string> {
    return this.header.get<'content-type', string>('content-type');
  }
  setLength(length: number): void {
    if (!isNumber(length) || length < 0) {
      throw new Error('Content-Length must be a non-negative number');
    }
    this.header.set('content-length', length.toString());
  }
  remove(): void {
    this.header.remove('content-type');
  }
  removeLength() {
    this.header.remove('content-length');
  }
}
