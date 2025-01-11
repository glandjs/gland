import { createServer } from 'http';
import { IncomingMessage, ServerResponse, Server } from 'http';
import { Context } from './Context';
import { MiddlewareFn } from '../common/interface/middleware.interface';
import { CoreModule } from './CoreModule';
import { AppConfig, AppConfigKey, AppConfigValue, Environment, GlobalCache, KEY_SETTINGS } from '../common/interface/app-settings.interface';
import { RouterManager } from '../router/RouterManager';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { CoreEventType, EventHandler, EventType, ContextHandler } from '../events/EventSystem.interface';
import { setPoweredByHeader } from '../utils';
import { HttpStatus } from '../common/enums/status.enum';
export class Application {
  private readonly coreModule: CoreModule;
  private readonly router: RouterManager;
  private readonly middleware: MiddlewareManager;
  private readonly settings: AppConfig;
  private _server!: Server;
  constructor(config?: AppConfig) {
    this.coreModule = new CoreModule(config);
    this.router = this.coreModule.router;
    this.middleware = this.coreModule.middleware;
    // Use settings in config
    const appName = config?.[KEY_SETTINGS.APP_NAME] || 'Default App';
    const environment = config?.[KEY_SETTINGS.ENVIRONMENT] || Environment.DEVELOPMENT;
    this.settings = this.coreModule.config.getAllSettings();
    this.coreModule.logger.info(`${appName} is running in ${environment} mode`);
  }

  /** Expose Cache System */
  get cache(): GlobalCache {
    return this.coreModule.cacheSystem;
  }
  /** Register a global middleware */
  use(...middleware: MiddlewareFn[]): Application {
    this.middleware.use(...middleware);
    return this;
  }

  /** Register controllers */
  register(controllers: Function[]): void {
    this.router.registerControllers(controllers);
  }
  /** HTTP request lifecycle */
  private async lifecycle(req: IncomingMessage, res: ServerResponse) {
    const context = new Context(req, res);
    const ctx = context.ctx;
    ctx.server = this;
    ctx.cache = this.cache;
    ctx.settings = this.settings;
    setPoweredByHeader(res, this.settings);
    try {
      await this.middleware.run(ctx, async () => {
        if (ctx.req.method === 'POST' || ctx.req.method === 'PUT') {
          await ctx.json();
          ctx.res.setHeader('content-length', ctx.bodySize);
        }
        await this.router.run(ctx);
      });
    } catch (error: any) {
      ctx.error = error;
      this.coreModule.events.emit(CoreEventType.Error, {
        method: ctx.req.method,
        body: ctx.body,
        headers: ctx.req.headers,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: new Date(),
        error: error,
        message: 'Internal Server Error',
      });
    }
  }
  onRoute(route: string, handler: EventHandler<CoreEventType.Route>): void {
    this.coreModule.events.onRoute(route, handler);
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
    const serverPort = port || 3000;
    const serverHostname = hostname || 'localhost';

    // Emit the start event after the application is fully initialized
    this.coreModule.events.emit(CoreEventType.Start, {
      timestamp: new Date(),
      environment: this.settings[KEY_SETTINGS.ENVIRONMENT],
      serverId: this.settings[KEY_SETTINGS.SERVER_ID],
      hostname: serverHostname,
      version: this.settings[KEY_SETTINGS.APP_VERSION] || 'v1.0.0',
      uptime: process.uptime(),
      nodeVersion: process.version,
    });

    // Start the server
    this._server = createServer(this.lifecycle.bind(this));
    this._server.listen(serverPort, serverHostname, () => {
      listeningListener?.();
    });
  }
  /** Stop the server */
  stop(reason: ContextHandler['StopContext']['reason'], error?: Error, callback?: () => void): void {
    if (this._server) {
      this._server.close(() => {
        // Create the context for the stop event
        let stopContext: ContextHandler['StopContext'] = {
          statusCode: 200, // Default status code (this could vary based on reason)
          statusMessage: 'OK', // Default message
          statusCodeClass: '2xx', // Default status class (you may modify this)
          timestamp: new Date(),
          reason: reason,
          exitCode: process.exitCode,
          error: error,
        };

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
  set(key: AppConfigKey, value: AppConfigValue): Application {
    this.settings[key] = value;
    return this;
  }

  /** Enable specific feature */
  enable(feature: AppConfigKey): Application {
    this.set(feature, true);
    return this;
  }

  /** Disable specific feature */
  disable(feature: AppConfigKey): Application {
    this.set(feature, false);
    return this;
  }

  /** Get configuration value */
  get(key: AppConfigKey): any {
    return this.settings[key];
  }
}
