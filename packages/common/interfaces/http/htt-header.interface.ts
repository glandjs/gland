import { OutgoingHttpHeaders } from 'http';
// Known headers with specific value types
type KnownHttpHeaders<XHeaders extends string = string> = {
  'content-type': 'text/html' | 'application/json' | 'application/octet-stream' | `${XHeaders}` | XHeaders;
  'content-length': number;
  'cache-control': string;
  'set-cookie': string[];
  'content-encoding': 'gzip' | 'deflate' | 'br' | 'identity';
  'content-language': string;
  'content-location': string;
  expires: string;
  'last-modified': string;
  'accept-language': string;
  'accept-encoding': string;
  'user-agent': string;
  'x-forwarded-for': string;
  'access-control-allow-origin': string;
  'access-control-allow-methods': string;
  'access-control-allow-headers': string;
  'access-control-expose-headers': string;
  'access-control-allow-credentials': boolean;
  'access-control-max-age': string;
  connection: string;
  etag: string;
  location: string;
  [key: `x-${string}`]: string;
};

export type HeaderName<T extends string = string, XHeaders extends string = string> = `${keyof KnownHttpHeaders<XHeaders>}` | `${T}` | T;
export type HeaderValue<T, XHeaders extends string> = T extends keyof KnownHttpHeaders ? KnownHttpHeaders<XHeaders>[T] : `${XHeaders}` | XHeaders;
export interface HeaderOperations {
  set<T extends string, XHeaders extends string>(name: HeaderName<T>, value: HeaderValue<T, XHeaders>): void;
  get<T extends string, XHeaders extends string>(name: HeaderName<T>): HeaderValue<T, XHeaders> | undefined;
  get(name: string): string | number | string[] | undefined;
  has(name: HeaderName): boolean;
  remove<T extends string>(name: HeaderName<T, string>): void;
  getAll(): OutgoingHttpHeaders;
}
