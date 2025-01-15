import { Stream } from 'stream';
import { IncomingMessage, ServerResponse } from 'http';
import { Context } from 'mocha';
import { HttpStatus } from '../enums';
import { GlobalCache, ParsedBody } from '../types';
import { AppConfig } from './app-settings.interface';
import { RouteDefinition } from './router.interface';
import { Application } from '../../core/Application';
export type ServerRequest = Context & {
  req: IncomingMessage;
  res: ServerResponse;
  status: HttpStatus;
  server: Application;
  body: ParsedBody['body'];
  bodySize: ParsedBody['bodySize'];
  bodyRaw: ParsedBody['bodyRaw'];
  query: Record<string, string | number | undefined>;
  params: { [key: string]: string };
  cache: GlobalCache;
  clientIp: string;
  settings: AppConfig;
  error: any;
  language: string;

  redirect(url: string, status?: HttpStatus): void;
  send<T = any>(body: ResponseBody<T>): void;
};

// Success response type
export interface SuccessResponse<T = any> {
  status?: 'success';
  data: T | null;
  message?: string;
  statusCode?: HttpStatus;
}
// Error response type
export interface ErrorResponse {
  status?: 'error';
  message?: string;
  statusCode: HttpStatus;
  stack?: string;
  error?: string;
}

// General ResponseBody Type
export type ResponseBody<T = any> = SuccessResponse<T> | ErrorResponse | string | Buffer | Stream;

/**
 * @interface TransformContext
 * @description
 * Represents the context object passed to the transformation function, containing request data.
 *
 * @property {Record<string, any>} [params] - The route parameters extracted from the request URL.
 * @property {Record<string, any>} [query] - The query parameters from the request URL.
 * @property {any} [body] - The parsed request body.
 * @property {Record<string, string>} [headers] - The request headers.
 * @property {string} method - The HTTP method of the request.
 * @property {string} path - The route path associated with the request.
 * @property {string} clientIp - The client's IP address.
 * @property {string} [userAgent] - The `User-Agent` header value.
 * @property {Record<string, string>} [cookies] - Parsed cookies from the request.
 * @property {'http' | 'https'} protocol - The request protocol.
 * @property {string} [referer] - The `Referer` header value, if available.
 * @property {string[] | string} [acceptedLanguages] - The `Accept-Language` header value.
 */
export interface TransformContext {
  params?: ServerRequest['params'];
  query?: ServerRequest['query'];
  body?: ServerRequest['body'];
  headers?: ServerRequest['req']['headers'];
  method: ServerRequest['req']['method'];
  path: RouteDefinition['path'];
  clientIp: ServerRequest['clientIp'];
  userAgent?: string;
  cookies?: Record<string, string>;
  protocol: 'http' | 'https';
  referer?: string;
  acceptedLanguages?: string[] | string;
}
export interface MultiLanguageContext {
  [lang: string]: string;
  default: string;
}
