import { Callback, isFunction, isString, Noop } from '@medishn/toolkit';
import { EventType } from '@glandjs/common';
import { ExpressLikeMiddleware, GlandMiddleware, HttpApplicationOptions, HttpContext, RouteAction, type BodyParserOptions } from './interface';
import { HttpAdapter } from './adapter';
import { PluginsManager } from './plugins';
import { HttpEventType } from './http-events.const';
import { CorsConfig, type ApplicationEventMap, type ServerListening } from './types/app-options.types';
import { HttpChannel } from './http-channel';
import { HttpInitializer } from './http-initializer';
import { RequestMethod } from './enum';

/**
 * The core HTTP server class for the Gland framework.
 *
 * `HttpCore` provides a fully event-driven HTTP/HTTPS server implementation
 * @example
 * ```typescript
 * // Simple route handler
 * app.get('/', (ctx) => {
 *   ctx.send('Hello, Gland!');
 * });
 * // Middleware example
 * app.use((ctx, next) => {
 *   console.log('Request received:', ctx.path);
 *   next();
 * });
 * ```
 */
export class HttpCore {
  private readonly _plugins: PluginsManager;
  private readonly channel: HttpChannel;

  private readonly _adapter: HttpAdapter;

  constructor(options?: HttpApplicationOptions) {
    this._adapter = new HttpAdapter();
    this.channel = new HttpChannel(this._adapter.events);
    const initial = new HttpInitializer(this.channel);
    initial.initialize(options);
    this._plugins = new PluginsManager(this.channel.config);
    this.initializeEvents(options);
  }
  private initializeEvents(options?: HttpApplicationOptions) {
    // Listen for HTTP requests
    this._adapter.events.on<HttpContext>('request', (ctx) => {
      this.channel.pipeline.execute(ctx);
    });
    this._adapter.events.emit('options', options);
    this._plugins.setupMiddleware(this);
  }
  get broker() {
    return this._adapter.broker;
  }

  get id() {
    return this.broker.id;
  }

  get settings() {
    return this._plugins.settings;
  }
  get bodyParser() {
    return this._plugins.bodyParser;
  }

  get proxy() {
    return this._plugins.proxy;
  }

  public listen(port: number, args?: ServerListening) {
    this._adapter.listen(port, args?.host, args?.message);
  }

  /**
   * @example
   * ```typescript
   * // Gland-style middleware
   * app.use((ctx, next) => {
   *   console.log('Request:', ctx.method, ctx.path);
   *   next();
   * });
   *
   * // Express-style middleware
   * app.use((req, res, next) => {
   *   res.setHeader('X-Powered-By', 'Gland');
   *   next();
   * });
   *
   * // Path-specific middleware
   * app.use('/api', (ctx, next) => {
   *   ctx.state.apiRequest = true;
   *   next();
   * });
   * ```
   */
  use(middleware: GlandMiddleware): void;
  use(middleware: ExpressLikeMiddleware): void;
  use(path: string, middleware: GlandMiddleware): void;
  use(path: string, middleware: ExpressLikeMiddleware): void;
  public use(...args: any): void {
    if (args.length === 2) {
      const [path, middleware] = args;

      if (isString(path) && isFunction(middleware)) {
        this.channel.middleware.use(path, middleware);
      }
    } else if (args.length === 1 && isFunction(args[0])) {
      this.channel.middleware.use(args[0]);
    } else {
      args[0].forEach((middleware: any) => {
        this.channel.middleware.use(middleware);
      });
    }
  }

  private _registerRoute(method: RequestMethod, path: string, action: RouteAction): this {
    this.channel.router.register(method, path, action);
    return this;
  }

  // HTTP Methods
  public get = (path: string, action: RouteAction): this => this._registerRoute(RequestMethod.GET, path, action);
  public post = (path: string, action: RouteAction): this => this._registerRoute(RequestMethod.POST, path, action);
  public put = (path: string, action: RouteAction): this => this._registerRoute(RequestMethod.PUT, path, action);
  public delete = (path: string, action: RouteAction): this => this._registerRoute(RequestMethod.DELETE, path, action);
  public patch = (path: string, action: RouteAction): this => this._registerRoute(RequestMethod.PATCH, path, action);
  public head = (path: string, action: RouteAction): this => this._registerRoute(RequestMethod.HEAD, path, action);
  public options = (path: string, action: RouteAction): this => this._registerRoute(RequestMethod.OPTIONS, path, action);
  public all = (path: string, action: RouteAction): this => this._registerRoute(RequestMethod.ALL, path, action);

  public enableCors(args: CorsConfig) {
    const cors = this._plugins.cors;
    cors.updateMany(args);
    this.use(this._plugins.cors.createMiddleware());
  }
  public useBodyParser(args: BodyParserOptions) {
    const bodyParser = this._plugins.bodyParser;
    bodyParser.updateMany(args);
    this.use(this._plugins.cors.createMiddleware());
  }
  public static() {
    console.warn('[HTTP] [WARN] Not implemented yet.');
  }

  // Event Management
  public on<T>(event: HttpEventType, listener: Callback<[T]>): Noop {
    const isExternal = this._adapter.events.getListeners(`external:${event}`);
    if (isExternal) {
      return this._adapter.events.on(`external:${event}`, listener);
    } else {
      return this._adapter.events.on(event, listener);
    }
  }
  public emit<T>(type: EventType, data: T) {
    this._adapter.events.emit(type, data);
  }

  public off<T>(event: HttpEventType, listener: Callback<[T]>): void {
    this._adapter.events.off(event, listener);
  }

  public system<K extends keyof ApplicationEventMap>(event: K, listener: ApplicationEventMap[K]): void {
    switch (event) {
      case 'crashed':
        this._adapter.events.on('$server:crashed', listener);
        break;
      case 'router:miss':
        this._adapter.events.on('$router:miss', listener);
        break;
      case 'request:failed':
        this._adapter.events.on('$request:failed', listener);
        break;
      default:
        throw Error(`Unknown system event: ${event}`);
    }
  }
}
