import { createServer } from 'http';
import { IncomingMessage, ServerResponse, Server } from 'http';
import { Context } from './Context';
import { MiddlewareFn } from '../common/interface/middleware.interface';
import { CoreModule } from './CoreModule';
import { AppConfig, KEY_SETTINGS } from '../common/interface/app-settings.interface';
import { RouterManager } from '../router/RouterManager';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
export class Application {
  private readonly coreModule: CoreModule;
  private readonly router: RouterManager;
  private readonly middleware: MiddlewareManager;
  private readonly settings: AppConfig;
  private _server!: Server;
  constructor(config: AppConfig) {
    this.coreModule = new CoreModule(config);
    this.router = this.coreModule.router;
    this.middleware = this.coreModule.middleware;
    this.settings = this.coreModule.config.getAllSettings();
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
    const { ctx } = new Context(req, res);
    ctx.server = this;
    if (ctx.method === 'POST' || ctx.method === 'PUT') {
      await ctx.json();
    }
    await this.middleware.run(ctx, async () => {
      if (ctx.method === 'POST' || ctx.method === 'PUT') {
        await ctx.json();
      }
      await this.router.run(ctx);
    });
  }
  /** Start the server */
  listen(port?: number, hostname?: string): void {
    const serverConfig = this.settings[KEY_SETTINGS.SERVER];
    const loggerConfig = this.settings[KEY_SETTINGS.LOGGER];
    const serverPort = port || serverConfig?.port;
    const serverHostname = hostname || serverConfig?.hostname;
    this._server = createServer(this.lifecycle.bind(this));
    this._server.listen(serverPort, serverHostname, () => {
      if (loggerConfig?.prettyPrint) {
        this.coreModule.logger.info(`Server is running at http://${serverHostname}:${serverPort}`);
      }
    });
  }
}
