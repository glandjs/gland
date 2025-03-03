import { IncomingMessage, ServerResponse } from 'http';
import { EventIdentifier } from '../../types';
import { HeaderName, HeaderOperations, HeaderValue, IHttpProtocol } from '../http';
import { HttpExceptionOptions, HttpStatus } from '@medishn/toolkit';
import { CookieOptions } from '@gland/common';
export interface ContextImpl {
  params?: { [key: string]: string };
  ip?: string;
  ips?: string[];
  host?: string | null;
  subdomains?: string[];
  error?: unknown;
  body?: any;

  // setters
  set state(data: Record<string, any>);
  set url(url: string);
  // getters
  get state(): Record<string, any>;
  get cookies(): Record<string, string>;
  get req(): IncomingMessage;
  get res(): ServerResponse;
  get responded(): boolean;
  get fresh(): boolean;
  get stale(): boolean;
  get xhr(): boolean;
  get originalUrl(): string;
  get path(): string;
  get protocol(): string;
  get query(): Record<string, string | number | undefined>;
  get url(): string | undefined;
  get status(): HttpStatus;
  set status(code: HttpStatus);
  get header(): HeaderOperations;

  // methods
  json<T>(body: T): void;
  emit<T extends string, D>(event: EventIdentifier<T>, data?: D);
  throw(status: HttpStatus, options?: HttpExceptionOptions): void;
  get<T extends string, XHeaders extends string>(name: HeaderName<T>): HeaderValue<T, XHeaders> | undefined;
  get(name: string): string | number | string[] | undefined;
  get(name: HeaderName): any;
  deleteCookie(name: string, options?: Partial<CookieOptions>): void;
  setCookie(name: string, value: string, options?: Partial<CookieOptions>): void;
  getCookie(name: string): string | undefined;
}
export interface Context extends ContextImpl, Pick<IHttpProtocol, 'send' | 'redirect' | 'method' | 'end'> {}
