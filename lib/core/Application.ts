import { createServer } from 'http';
import { IncomingMessage, ServerResponse, Server } from 'http';
import { Context } from './Context';
import { MiddlewareFn } from '../common/interface/middleware.interface';
import { CoreModule } from './CoreModule';
import { AppConfig, Environment, GlobalCache, KEY_SETTINGS } from '../common/interface/app-settings.interface';
import { RouterManager } from '../router/RouterManager';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { MemoryCacheStore } from '../utils/Cache';
export class Application {
  private readonly coreModule: CoreModule;
  private readonly router: RouterManager;
  private readonly middleware: MiddlewareManager;
  private readonly settings: AppConfig;
  private _server!: Server;
  private cacheSystem: GlobalCache;
  constructor(config?: AppConfig) {
    this.coreModule = new CoreModule(config);
    this.router = this.coreModule.router;
    this.middleware = this.coreModule.middleware;
    // Use settings in config
    const appName = config?.[KEY_SETTINGS.APP_NAME] || 'Default App';
    const environment = config?.[KEY_SETTINGS.ENVIRONMENT] || Environment.DEVELOPMENT;
    this.settings = this.coreModule.config.getAllSettings();
    this.cacheSystem = new MemoryCacheStore(config?.[KEY_SETTINGS.CACHE]);
    this.coreModule.logger.info(`${appName} is running in ${environment} mode`);
  }
  /** Expose Cache System */
  get cache(): GlobalCache {
    return this.cacheSystem;
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
    await this.middleware.run(ctx, async () => {
      if (ctx.req.method === 'POST' || ctx.req.method === 'PUT') {
        await ctx.json();
      }
      await this.router.run(ctx);
    });
  }
  /** Start the server */
  listen(port?: number, hostname?: string, listeningListener?: () => void): void {
    const serverPort = port || 3000;
    const serverHostname = hostname || 'localhost';
    this._server = createServer(this.lifecycle.bind(this));
    this._server.listen(serverPort, serverHostname, listeningListener);
  }
}
