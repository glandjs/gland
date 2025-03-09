import { AdapterContext, RequestMethod } from '@gland/common';
import { Dictionary, HttpExceptionOptions, HttpStatus, Maybe, Noop } from '@medishn/toolkit';
import { HttpHeaderName, HttpHeaderValue, HttpHeaders } from './headers.interface';

import { IncomingMessage, ServerResponse } from 'node:http';
import { CookieOptions } from './http-options.interface';

/**
 * HTTP-specific context providing access to request/response objects and utility methods
 */
export interface HttpContext extends AdapterContext<'http'> {
  /**
   * Get the request protocol (always 'http' for HttpContext)
   */
  protocol?: string;

  isSecure?: boolean;

  /**
   * URL parameters extracted from route patterns
   */
  params?: Dictionary<string>;

  /**
   * Client IP address
   */
  ip?: Maybe<string>;

  /**
   * Client IP addresses (including proxies)
   */
  ips?: Maybe<string[]>;

  /**
   * Host name from the request headers
   */
  host?: Maybe<string>;

  /**
   * Subdomains array
   */
  subdomains?: Maybe<string[]>;

  /**
   * Request body
   */
  body?: any;

  /**
   * Set the URL for the request
   */
  set url(url: string);

  /**
   * Get the request path
   */
  set path(path: string);

  /**
   * Get cookies from the request
   */
  get cookies(): Dictionary<string>;

  /**
   * Get the raw IncomingMessage object
   */
  get req(): IncomingMessage;

  /**
   * Get the raw ServerResponse object
   */
  get res(): ServerResponse;

  /**
   * Check if a response has been sent
   */
  get responded(): boolean;

  /**
   * Check if the request is fresh (based on caching headers)
   */
  get fresh(): boolean;

  /**
   * Check if the request is stale (based on caching headers)
   */
  get stale(): boolean;

  /**
   * Check if the request is an XMLHttpRequest
   */
  get xhr(): boolean;

  /**
   * Get the request path
   */
  get path(): string;

  /**
   * Get the query parameters
   */
  get query(): Dictionary<string | number | undefined>;

  /**
   * Get the request URL
   */
  get url(): Maybe<string>;

  /**
   * Get the HTTP status code
   */
  get status(): HttpStatus;

  /**
   * Set the HTTP status code
   */
  set status(code: HttpStatus);

  /**
   * Get all headers
   */
  get header(): HttpHeaders;

  /**
   * Get the request method
   */
  get method(): Maybe<RequestMethod>;

  // methods

  /**
   * Send a JSON response
   * @param body Data to be serialized as JSON
   */
  json<T>(body: T): void;

  /**
   * Throw an HTTP exception
   * @param status HTTP status code
   * @param options Additional exception options
   */
  throw(status: HttpStatus, options?: HttpExceptionOptions): void;

  /**
   * Get a header value by name with type safety
   */
  get<T extends string, XHeaders extends string>(name: HttpHeaderName<T>): HttpHeaderValue<T, XHeaders> | undefined;
  get(name: string): string | number | string[] | undefined;
  get(name: HttpHeaderName): any;

  /**
   * Delete a cookie
   * @param name Cookie name
   * @param options Cookie options
   */
  deleteCookie(name: string, options?: Partial<CookieOptions>): void;

  /**
   * Set a cookie
   * @param name Cookie name
   * @param value Cookie value
   * @param options Cookie options
   */
  setCookie(name: string, value: string, options?: Partial<CookieOptions>): void;

  /**
   * Get a cookie value
   * @param name Cookie name
   */
  getCookie(name: string): Maybe<string>;

  /**
   * Send a response with any type of data
   * @param body Response body
   */
  send<T>(body: T): void;

  /**
   * redirect() sends a redirection response.
   * Defaults to a 302 status if not provided.
   */
  redirect(url: string, status?: HttpStatus): void;

  /**
   * End the response
   */
  end(cb?: Noop): this;
  end(chunk: any, cb?: Noop): this;
  end(chunk: any, encoding: BufferEncoding, cb?: Noop): this;
}
