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
  length(): number {
    const length = this.header.get('content-length');
    if (isString(length)) {
      return parseInt(length, 10);
    }
    return isNumber(length) ? length : 0;
  }
  getCharset(): Maybe<string> {
    const contentType = this.get();
    if (!contentType) return undefined;

    const match = contentType.match(/charset=([a-zA-Z0-9-]+)/);
    return match ? match[1] : undefined;
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
  is(type: string): boolean {
    const contentType = this.get();
    if (isNil(contentType)) return false;

    return contentType.split(';')[0].trim() === type;
  }
}
