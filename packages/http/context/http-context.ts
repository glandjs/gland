import { Context } from '@gland/core';
import { normalizePath, RequestMethod, EventType } from '@gland/common';
import { IncomingMessage, ServerResponse } from 'http';
import { Dictionary, HttpException, HttpExceptionOptions, HttpStatus, isString, isUndefined, Maybe } from '@medishn/toolkit';
import { TLSSocket } from 'tls';
import { CookieOptions, HttpContext, HttpHeaderName, HttpHeaders, HttpHeaderValue, ProxyOptions, SettingsOptions } from '../interface';
import { RequestContext } from './request-context';
import { HttpEventCore } from '../adapter/http-events';
import { generateETag, normalizeTrustProxy, TrustProxyEvaluator } from '../plugins/utils';
import { parse as parseQuery } from 'querystring';
import type { Broker } from '@gland/events';

/**
 * HTTP-specific context providing access to request/response objects and utility methods.
 *
 * This class serves as the primary interface for handling HTTP requests and responses.
 * It encapsulates the request (`IncomingMessage`) and response (`ServerResponse`) objects,
 * providing a rich set of methods and properties to interact with them in a type-safe manner.
 *
 * @example
 * ctx.send('Hello World');
 */
export class HttpServerContext extends Context<'http'> implements HttpContext {
  mode: 'http';
  private _query: Dictionary<string | number | undefined> = {};
  private _path?: string;
  private _parsedUrl?: URL;
  private _request: RequestContext;
  constructor(
    private _events: HttpEventCore,
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    super('http');
    this._request = new RequestContext(req, res);
    this._initializeQuery();
  }

  get req(): IncomingMessage {
    return this._request.req;
  }
  get res(): ServerResponse<IncomingMessage> {
    return this._request.res;
  }

  private _initializeQuery(): void {
    const url = this.req.url || '';
    const queryIndex = url.indexOf('?');

    if (queryIndex !== -1) {
      const queryStr = url.slice(queryIndex + 1);
      const parsed = parseQuery(queryStr);

      for (const key in parsed) {
        const value = parsed[key];
        if (!isUndefined(value)) {
          if (/^\d+$/.test(value as string)) {
            this._query[key] = parseInt(value as string, 10);
          } else if (/^\d+\.\d+$/.test(value as string)) {
            this._query[key] = parseFloat(value as string);
          } else {
            this._query[key] = value as string;
          }
        }
      }
    }
  }

  private _getUrl(): URL {
    if (!this._parsedUrl) {
      try {
        this._parsedUrl = new URL(this.req.url || '', `${this.protocol}://${this.req.headers.host || 'localhost'}`);
      } catch (error) {
        this._parsedUrl = new URL(`${this.protocol}://localhost`);
      }
    }
    return this._parsedUrl;
  }

  get cookies(): Dictionary<string> {
    const cookieHeader = this.req.headers['cookie'];
    const result: Dictionary<string> = {};

    if (isUndefined(cookieHeader)) {
      return result;
    }

    const pairs = cookieHeader.split(';');

    for (const pair of pairs) {
      const [name, value] = pair.trim().split('=');
      if (name && !isUndefined(value)) {
        result[name] = decodeURI(value);
      }
    }

    return result;
  }

  /**
   * Check if a response has been sent to the client.
   * @readonly
   */
  get replied(): boolean {
    return this.res.writableEnded;
  }

  get method(): Maybe<RequestMethod> {
    return this._request.method;
  }

  get status(): HttpStatus {
    return this._request.status;
  }

  set status(code: HttpStatus) {
    this._request.status = code;
  }

  get header(): HttpHeaders {
    return this._request.header;
  }

  get fresh(): boolean {
    // Only GET and HEAD requests can be fresh
    const method = this.method;
    if (method !== 'GET' && method !== 'HEAD') {
      return false;
    }

    // Status code must be a success code (2xx)
    const status = this.status;
    if (status < 200 || status >= 300) {
      return false;
    }

    // If-None-Match
    const noneMatch = this.req.headers['if-none-match'];
    if (noneMatch) {
      const etag = this.res.getHeader('etag');
      if (!etag) {
        return false;
      }

      return this._checkETagFreshness(noneMatch as string, etag as string);
    }

    const modifiedSince = this.req.headers['if-modified-since'];
    if (modifiedSince && this.res.getHeader('last-modified')) {
      return this._checkDateFreshness(modifiedSince as string, this.res.getHeader('last-modified') as string);
    }

    return false;
  }

  get stale(): boolean {
    return !this.fresh;
  }

  get xhr(): boolean {
    const header = this.req.headers['x-requested-with'];
    return header === 'XMLHttpRequest';
  }

  get originalUrl(): string {
    return this.req.url || '';
  }

  get path(): string {
    if (!this._path) {
      const url = this._getUrl();
      this._path = url.pathname;
    }
    return this._path;
  }

  set path(path: string) {
    this._path = path;
  }

  /**
   * Get the request protocol (http or https)
   */
  get protocol(): string {
    const getConfig = this._events.getListeners('config:get')[0] as any;
    const proxy = getConfig('proxy') as ProxyOptions;
    const trustEvaluator = new TrustProxyEvaluator(normalizeTrustProxy(proxy.trustProxy));
    const remoteIp = this.req.socket.remoteAddress;
    const isTrusted = remoteIp && trustEvaluator.isTrusted(remoteIp, 1);
    if (isTrusted) {
      const proto = this.req.headers['x-forwarded-proto'];
      if (isString(proto)) {
        return proto.split(',')[0].trim().toLowerCase();
      } else if (Array.isArray(proto)) {
        return proto[0].toLowerCase();
      }
    }

    const isEncrypted = this.req.socket instanceof TLSSocket;
    return isEncrypted ? 'https' : 'http';
  }

  get query(): Dictionary<string | number | undefined> {
    return this._query;
  }

  get url(): string | undefined {
    return this.req.url;
  }

  set url(url: string) {
    this.req.url = url;
  }

  public send<T>(body: T): void {
    if (body && this.method === 'GET' && !this.header.get('ETag')) {
      const content = isString(body) ? body : JSON.stringify(body);
      const getConfig = this._events.getListeners('config:get')[0] as any;
      const settingsOptions = getConfig('settings') as SettingsOptions;
      const etag = generateETag(content, settingsOptions.etag?.algorithm, settingsOptions.etag?.strength);
      this.header.set('etag', etag);
    }

    if (this.fresh) {
      this.status = 304;
      this._request.end();
      return;
    }

    return this._request.send(body);
  }

  public redirect(url: string, status: HttpStatus = 302): void {
    const getConfig = this._events.getListeners('config:get')[0] as any;
    const settingsOptions = getConfig('settings') as SettingsOptions;
    const prefixedUrl = `${settingsOptions.globalPrefix}${normalizePath(url)}`;

    return this._request.redirect(prefixedUrl, status);
  }

  public end(cb?: () => void): this;
  public end(chunk: any, cb?: () => void): this;
  public end(chunk: any, encoding: BufferEncoding, cb?: () => void): this;
  public end(): any {
    return this._request.end(...arguments);
  }

  public json<T>(body: T): void {
    if (!this._request.header.get('content-type')) {
      this._request.header.set('content-type', 'application/json');
    }
    this.send(body);
  }

  public emit<D>(event: EventType, data?: D) {
    const type = event.startsWith('@') ? event.split('@')[1] : event;
    const broker = this._events['_channel']['broker'] as Broker;
    const channels = this.state.channel;
    if (event.startsWith('@')) {
      broker.emitTo('core', `http:external:${type}`, data);
    } else {
      for (const channel of channels) {
        if (channel.event === type) {
          broker.emitTo('core', channel.fullEvent, data);
        }
      }
    }
  }

  public throw(status: HttpStatus, options?: HttpExceptionOptions): void {
    const exception = new HttpException(status, options);

    this.status = exception.status;

    if (!this._request.header.get('content-type')) {
      this._request.header.set('content-type', 'application/json');
    }

    this.send(exception.getProblemDetails());
  }

  public get<T extends string, XHeaders extends string>(name: HttpHeaderName<T>): HttpHeaderValue<T, XHeaders> | undefined;
  public get(name: string): string | number | string[] | undefined;
  public get(name: HttpHeaderName): any {
    return this.header.get(name);
  }

  public deleteCookie(name: string, options?: Partial<CookieOptions>): void {
    this._request.cookies.delete(name, options);
  }
  public setCookie(name: string, value: string, options?: Partial<CookieOptions>): void {
    this._request.cookies.set(name, value, options);
  }
  public getCookie(name: string): Maybe<string> {
    return this._request.cookies.get(name);
  }

  private _checkETagFreshness(noneMatch: string, etag: string): boolean {
    if (noneMatch === '*') {
      return true;
    }

    const etagVal = String(etag).trim();
    const clientETags = String(noneMatch)
      .split(',')
      .map((tag) => tag.trim());

    for (const clientETag of clientETags) {
      if (this._weakETagMatch(clientETag, etagVal)) {
        return true;
      }
    }

    return false;
  }

  private _checkDateFreshness(modifiedSince: string, lastModified: string): boolean {
    const lastModifiedDate = new Date(String(lastModified));
    const modifiedSinceDate = new Date(String(modifiedSince));

    if (!isNaN(lastModifiedDate.getTime()) && !isNaN(modifiedSinceDate.getTime())) {
      return lastModifiedDate <= modifiedSinceDate;
    }

    return false;
  }

  private _weakETagMatch(clientETag: string, serverETag: string): boolean {
    // Remove quotes and W/ prefix for comparison
    const normalizeETag = (etag: string): string => {
      if (etag.startsWith('W/"') && etag.endsWith('"')) {
        return etag.substring(3, etag.length - 1);
      } else if (etag.startsWith('"') && etag.endsWith('"')) {
        return etag.substring(1, etag.length - 1);
      }
      return etag;
    };

    return normalizeETag(clientETag) === normalizeETag(serverETag);
  }
}
