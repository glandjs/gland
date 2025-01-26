import { RequestMethod } from '../../enums';
import { GlandApplicationOptions } from '../application/app-options.interface';

export type ErrorHandler<TRequest = any, TResponse = any> = (error: any, req: TRequest, res: TResponse, next?: Function) => any;
export type RequestHandler<TRequest = any, TResponse = any> = (req: TRequest, res: TResponse, next?: Function) => any;

export interface HttpServer<TRequest = any, TResponse = any, ServerInstance = any> {
  // Middleware handling
  use(handler: RequestHandler<TRequest, TResponse> | ErrorHandler<TRequest, TResponse>): any;
  use(path: string, handler: RequestHandler<TRequest, TResponse> | ErrorHandler<TRequest, TResponse>): any;
  registerParserMiddleware(...args: any[]): any;

  /**
   * Add support for parsing request bodies if not already provided.
   */
  useBodyParser?(...args: any[]): any;

  // HTTP methods
  get(handler: RequestHandler<TRequest, TResponse>): any;
  get(path: string, handler: RequestHandler<TRequest, TResponse>): any;

  post(handler: RequestHandler<TRequest, TResponse>): any;
  post(path: string, handler: RequestHandler<TRequest, TResponse>): any;

  put(handler: RequestHandler<TRequest, TResponse>): any;
  put(path: string, handler: RequestHandler<TRequest, TResponse>): any;

  patch(handler: RequestHandler<TRequest, TResponse>): any;
  patch(path: string, handler: RequestHandler<TRequest, TResponse>): any;

  delete(handler: RequestHandler<TRequest, TResponse>): any;
  delete(path: string, handler: RequestHandler<TRequest, TResponse>): any;

  options(handler: RequestHandler<TRequest, TResponse>): any;
  options(path: string, handler: RequestHandler<TRequest, TResponse>): any;

  head(handler: RequestHandler<TRequest, TResponse>): any;
  head(path: string, handler: RequestHandler<TRequest, TResponse>): any;

  search?(handler: RequestHandler<TRequest, TResponse>): any;
  search?(path: string, handler: RequestHandler<TRequest, TResponse>): any;

  /**
   * Handle all HTTP methods for a given route.
   */
  all(handler: RequestHandler<TRequest, TResponse>): any;
  all(path: string, handler: RequestHandler<TRequest, TResponse>): any;

  // Static assets
  useStaticAssets?(...args: any[]): this;

  // Views and templating
  setBaseViewsDir?(path: string | string[]): this;
  setViewEngine?(engineOrOptions: any): this;
  render(response: any, view: string, options: any): any;

  // Error handling
  setErrorHandler?(handler: Function, prefix?: string): any;
  setNotFoundHandler?(handler: Function, prefix?: string): any;

  // CORS support
  enableCors(options: any): any;

  // Server lifecycle
  listen(port: number | string, callback?: () => void): any;
  listen(port: number | string, hostname: string, callback?: () => void): any;
  close(): any;

  // Instance and initialization
  getInstance(): ServerInstance;
  initHttpServer(options: GlandApplicationOptions): void;
  getHttpServer(): any;
  init?(): Promise<void>;

  // Adapter metadata
  getType(): string; //adapter type (e.g., "express", "koa", "gland")
}
