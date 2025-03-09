import { Callback, Constructor, isFunction, isString, Noop } from '@medishn/toolkit';
import { EventIdentifier, RequestMethod } from '@gland/common';
import { EventBroker } from '@gland/core';
import { ExpressLikeMiddleware, GlandMiddleware, HttpApplicationOptions, HttpContext, RouteAction, StageConfiguration } from './interface';
import { PipelineEngine, PipelineChannel } from './pipeline';
import { HttpAdapter, HttpEventCore } from './adapter';
import { MiddlewareChannel, MiddlewareManager } from './middleware';
import { Router, RouterChannel } from './router';
import { ConfigChannel, FeatureConfigManager } from './config';
import { HttpEventType } from './http-events.const';
import { CorsConfig } from './types/app-options.types';

export class HttpApplication extends HttpAdapter {
  private readonly _configChannel: ConfigChannel;
  private readonly _routerChannel: RouterChannel;
  private readonly _pipelineChannel: PipelineChannel;
  private readonly _middlewareChannel: MiddlewareChannel;
  private readonly _features: FeatureConfigManager;
  constructor(broker: EventBroker, options?: HttpApplicationOptions) {
    const events = broker.channel('http');
    const httpEventsChannel = new HttpEventCore(events);
    super(httpEventsChannel);
    this._configChannel = new ConfigChannel(httpEventsChannel.channel('config'));
    this._routerChannel = new RouterChannel(httpEventsChannel.channel('router'));
    this._pipelineChannel = new PipelineChannel(httpEventsChannel.channel('pipeline'));
    this._middlewareChannel = new MiddlewareChannel(this._events.channel('middleware'));
    this._configChannel.initialize(options);
    this._features = new FeatureConfigManager(this._configChannel);
    this.initialBaseEventChannel(options);
  }
  private initialBaseEventChannel(options?: HttpApplicationOptions) {
    new MiddlewareManager(this._middlewareChannel);
    new Router(this._routerChannel, this._configChannel);
    new PipelineEngine(this._pipelineChannel, this._events, this._routerChannel, this._middlewareChannel);
    
    // Listen for HTTP requests
    this._events.on<HttpContext>('request', (ctx) => {
      this._pipelineChannel.execute(ctx);
    });

    this._events.emit('options', options);
    this.initialDefaultGlobalMiddleware();
  }

  private initialDefaultGlobalMiddleware() {
    this._features.setupMiddleware(this);
  }

  get settings() {
    return this._features.settings;
  }
  get bodyParser() {
    return this._features.bodyParser;
  }

  get proxy() {
    return this._features.proxy;
  }

  /**
   * app.use((ctx,next))
   */
  use(middleware: GlandMiddleware): void;
  /**
   * app.use((req,res,next))
   */
  use(middleware: ExpressLikeMiddleware): void;
  /**
   * app.use("/",((ctx,next)))
   */
  use(path: string, middleware: GlandMiddleware): void;
  /**
   * app.use("/",((req,res,next)))
   */
  use(path: string, middleware: ExpressLikeMiddleware): void;
  public use(...args: any): void {
    if (args.length === 2) {
      const [path, middleware] = args;

      if (isString(path) && isFunction(middleware)) {
        this._middlewareChannel.use(path, middleware);
      }
    } else if (args.length === 1 && isFunction(args[0])) {
      this._middlewareChannel.use(args[0]);
    } else {
      args[0].forEach((middleware: any) => {
        this._middlewareChannel.use(middleware);
      });
    }
  }

  private _registerRoute(method: RequestMethod, path: string, action: RouteAction): this {
    this._routerChannel.register(method, path, action);
    return this;
  }

  // HTTP Methods
  public get(path: string, action: RouteAction): this {
    return this._registerRoute(RequestMethod.GET, path, action);
  }

  public post(path: string, action: RouteAction): this {
    return this._registerRoute(RequestMethod.POST, path, action);
  }

  public put(path: string, action: RouteAction): this {
    return this._registerRoute(RequestMethod.PUT, path, action);
  }

  public delete(path: string, action: RouteAction): this {
    return this._registerRoute(RequestMethod.DELETE, path, action);
  }

  public patch(path: string, action: RouteAction): this {
    return this._registerRoute(RequestMethod.PATCH, path, action);
  }
  public head(path: string, action: RouteAction): this {
    return this._registerRoute(RequestMethod.HEAD, path, action);
  }

  public options(path: string, action: RouteAction): this {
    return this._registerRoute(RequestMethod.OPTIONS, path, action);
  }

  public all(path: string, action: RouteAction): this {
    return this._registerRoute(RequestMethod.ALL, path, action);
  }

  public pipe(pipeline: Constructor, configuration: Partial<StageConfiguration> = {}) {
    this._pipelineChannel.register(pipeline, configuration);
    return this;
  }
  public enableCors(args: CorsConfig) {
    const cors = this._features.cors;
    cors.updateMany(args);
    this.use(this._features.cors.createMiddleware());
  }
  public useBodyParser() {}
  public static() {}

  public on<T>(event: HttpEventType, listener: Callback<[T]>): Noop {
    return this._events.on(event, listener);
  }
  public emit<T>(type: EventIdentifier, data: T) {
    this._events.emit(type, data);
  }
  public off<T>(event: HttpEventType, listener: Callback<[T]>): void {
    this._events.off(event, listener);
  }
}
