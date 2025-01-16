import { IncomingMessage, ServerResponse, Server, createServer } from 'http';
import Reflector from '../metadata';
import { CoreModule } from './CoreModule';
import { Router } from '../router';
import { MiddlewareStack } from '../middleware';
import { setPoweredByHeader } from '../utils';
import { Context, ContextFactory } from '../context';
import { Injector } from '../decorator';
import { AppConfig, Constructor, LifecycleEvents, RouteDefinition } from '../common/interfaces';
import { CoreEventType, KEY_SETTINGS, ModuleMetadataKeys, RouterMetadataKeys } from '../common/enums';
import { AppConfigKey, AppConfigValue, EventHandler, EventType, GlobalCache, MiddlewareFn, Provider } from '../common/types';
export class Application {
  private readonly coreModule: CoreModule;
  private readonly router: Router;
  private readonly middleware: MiddlewareStack;
  private readonly settings: AppConfig;
  private static injector = new Injector();
  private _server!: Server;
  constructor(config?: AppConfig) {
    this.coreModule = new CoreModule(config);
    this.router = this.coreModule.router;
    this.middleware = this.coreModule.middleware;
    // Use settings in config
    this.settings = this.coreModule.config.getAllSettings();
    const appName = this.settings?.[KEY_SETTINGS.APP_NAME];
    const environment = this.settings?.[KEY_SETTINGS.ENVIRONMENT];
    this.coreModule.logger.info(`${appName} is running in ${environment} mode`);
  }
  /** Expose Cache System */
  get cache(): GlobalCache {
    return this.coreModule.cacheSystem;
  }
  /** Register a global middleware */
  use(...middleware: MiddlewareFn[]): this {
    this.middleware.use(...middleware);
    return this;
  }

  /** HTTP request lifecycle */
  private async lifecycle(req: IncomingMessage, res: ServerResponse) {
    const context = new Context(req, res);
    const ctx = context.ctx;
    ctx.server = this;
    ctx.cache = this.cache;
    ctx.settings = this.settings;
    setPoweredByHeader(res, this.settings);
    const bodyParser = this.coreModule.bodyParser(req, this.settings[KEY_SETTINGS.BODY_PARSER]);
    const { bodyRaw, bodySize, body } = await bodyParser.parse();
    let errorContext = ContextFactory.createErrorContext(ctx, null);
    // Set parsed body
    try {
      ctx.body = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (parseError: any) {
      ctx.body = null; // Default if JSON parsing fails
      errorContext = ContextFactory.createErrorContext(ctx, parseError);
      errorContext.statusCode = 400;
      errorContext.statusMessage = 'BAD_REQUEST';
      errorContext.statusCodeClass = '4xx';
      this.coreModule.events.emit(CoreEventType.Error, errorContext);
      if (ctx.res.writableEnded) return;
    }
    ctx.bodySize = bodySize;
    ctx.bodyRaw = bodyRaw;
    ctx.res.setHeader('Content-Length', ctx.bodySize);
    try {
      await this.middleware.execute(ctx, async () => {
        await this.router.run(ctx);
      });
    } catch (error: any) {
      ctx.error = error;
      errorContext = ContextFactory.createErrorContext(ctx, error);
      this.coreModule.events.emit(CoreEventType.Error, errorContext);
      errorContext.error = error;
      if (ctx.res.writableEnded) return;
    }
  }
  onRoute(route: string, handler: EventHandler<CoreEventType.Route>): void {
    this.coreModule.events.on(CoreEventType.Route, route, handler);
  }

  /**
   * Register an event listener.
   *
   * @param event - The event type.
   * @param handler - The event handler.
   */
  on<T extends EventType>(event: T, handler: EventHandler<CoreEventType>): this {
    const eventKey = event as keyof typeof CoreEventType;
    const formattedEventKey = eventKey.charAt(0).toUpperCase() + eventKey.slice(1);
    const coreEvent = CoreEventType[formattedEventKey as keyof typeof CoreEventType];
    this.coreModule.events.on(coreEvent, handler);
    return this;
  }

  /**
   * Register a one-time event listener.
   *
   * @param event - The event type.
   * @param handler - The event handler.
   */
  once<T extends EventType>(event: T, handler: EventHandler<CoreEventType>): this {
    const coreEvent = CoreEventType[event as keyof typeof CoreEventType];
    this.coreModule.events.once(coreEvent, handler);
    return this;
  }

  /**
   * Remove an event listener.
   *
   * @param event - The event type.
   * @param handler - The event handler to remove.
   */
  off<T extends EventType>(event: T, handler: EventHandler<CoreEventType>): this {
    const coreEvent = CoreEventType[event as keyof typeof CoreEventType];
    this.coreModule.events.off(coreEvent, handler);
    return this;
  }

  /** Start the server */
  listen(port?: number, hostname?: string, listeningListener?: () => void): void {
    // Default port and hostname
    const serverPort = port ?? 3000;
    const serverHostname = hostname ?? 'localhost';
    // Emit the start event after the application is fully initialized
    this.coreModule.events.emit(
      CoreEventType.Start,
      ContextFactory.createStartContext(this.settings[KEY_SETTINGS.ENVIRONMENT]!, {
        hostname: serverHostname,
        nodeVersion: process.version,
        serverId: this.settings[KEY_SETTINGS.SERVER_ID]!,
        version: this.settings[KEY_SETTINGS.APP_VERSION]!,
      }),
    );

    // Start the server
    this._server = createServer(this.lifecycle.bind(this));
    this._server.listen(serverPort, serverHostname, () => {
      listeningListener?.();
    });
  }
  /** Stop the server */
  stop(reason: LifecycleEvents['Stop']['reason'], error?: Error, callback?: () => void): void {
    if (this._server) {
      this._server.close(() => {
        // Create the context for the stop event
        let stopContext = ContextFactory.createStopContext(reason, process.exitCode, error);

        // Modify statusCode, statusMessage, and statusCodeClass based on the reason or error
        switch (reason) {
          case 'maintenance':
            stopContext.statusCode = 503;
            stopContext.statusMessage = 'SERVICE_UNAVAILABLE';
            stopContext.statusCodeClass = '5xx';
            break;
          case 'shutdown':
            stopContext.statusCode = 200;
            stopContext.statusMessage = 'OK';
            stopContext.statusCodeClass = '2xx';
            break;
          case 'server_error':
            stopContext.statusCode = 500;
            stopContext.statusMessage = 'INTERNAL_SERVER_ERROR';
            stopContext.statusCodeClass = '5xx';
            break;
          case 'timeout':
            stopContext.statusCode = 408;
            stopContext.statusMessage = 'REQUEST_TIMEOUT';
            stopContext.statusCodeClass = '4xx';
            break;
          case 'error':
            stopContext.statusCode = 400;
            stopContext.statusMessage = 'BAD_REQUEST';
            stopContext.statusCodeClass = '4xx';
            break;
          default:
            break;
        }

        // Emit the stop event with the context
        this.coreModule.events.emit(CoreEventType.Stop, stopContext);
        callback?.();
      });
    }
  }
  /** Set configuration values */
  set(key: AppConfigKey, value: AppConfigValue): this {
    this.settings[key] = value;
    return this;
  }

  /** Enable specific feature */
  enable(feature: AppConfigKey): this {
    this.set(feature, true);
    return this;
  }

  /** Disable specific feature */
  disable(feature: AppConfigKey): this {
    this.set(feature, false);
    return this;
  }

  /** Get configuration value */
  get(key: AppConfigKey): any {
    return this.settings[key];
  }

  static create(rootModule: Constructor<any>, config?: AppConfig) {
    const app = new Application(config);

    const injector = Application.injector;
    injector.initializeModule(rootModule);
    return app;
  }
}
