import { createServer } from 'http';
import { AppConfig } from '../types';
import { IncomingMessage, ServerResponse, Server } from 'http';
import { AppSettings } from './AppSettings';
import { Context } from './Context';
import { GLogger } from '../utils/Logger';
import { Middleware } from '../middleware/Middleware';
import { MiddlewareFn } from '../middleware/Middleware.interface';
import { Router } from '../router/Router';
export class Application extends AppSettings {
  private _server!: Server;
  private router: Router;
  private middlewares: Middleware;
  constructor(private appConfig: AppConfig) {
    super();
    this.router = new Router();
    this.middlewares = new Middleware();
  }
  use(middleware: MiddlewareFn): Application {
    this.middlewares.new(middleware);
    return this;
  }
  registerControllers(controllers: Function[]): void {
    this.router.registerControllers(controllers);
  }
  private async lifecycle(req: IncomingMessage, res: ServerResponse) {
    const { ctx } = new Context(req, res);
    ctx.server = this;
    this.router.run(ctx);
  }
  listen(port?: number, hostname?: string, listeningListener?: () => void, backlog?: number): void {
    this._server = createServer(this.lifecycle.bind(this));
    this._server.listen(port ? port : this.appConfig.port, hostname ? hostname : this.appConfig.hostname, backlog, () => {
      if (this.appConfig.watch) {
        this._cache['watch'] = true;
        GLogger.info(`Server is running on http://${hostname ? hostname : this.appConfig.hostname}:${port ? port : this.appConfig.port}`);
      }
      listeningListener ? listeningListener() : null;
    });
  }
}
