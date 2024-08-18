import { IncomingMessage, Server, ServerResponse } from 'http';
import { Parser } from '../helper/parser';
import { Gland } from '../types/gland';
import { ServerUtils } from '../helper';
import { WebContext } from './context';
import { Router } from './router';
import { LoadModules } from '../helper/load';
export class WebServer extends Server implements Gland.Listener {
  private middlewares: Gland.Middleware[] = [];
  constructor() {
    super();
  }
  use(path: string | Gland.Middleware, ...handlers: Gland.Middleware[]): this {
    if (typeof path === 'string') {
      handlers.forEach(async (handler) => {
        this.middlewares.push(async (ctx, next) => {
          if (ctx.url.startsWith(path)) {
            handler(ctx, next);
          } else {
            await next();
          }
        });
      });
    } else {
      this.middlewares.push(path, ...handlers);
    }
    return this;
  }
  private async lifecycle(req: IncomingMessage, res: ServerResponse) {
    const { ctx } = new WebContext(req, res);
    const { method, path, url, base } = await Parser.Request(req);
    ctx.query = Object.fromEntries(url.searchParams.entries());
    const matchingRoute = Router.findMatch(path, method, base);
    if (matchingRoute) {
      const { controller, handlerKey, params } = matchingRoute;
      ctx.params = params;
      const routeInstance = new controller();
      await Router.run(ctx, routeInstance, method, handlerKey, this.middlewares);
    }
  }
  init(opts: Gland.ListenOptions, listeningListener?: (info: Gland.ListenOptions) => void): Server {
    this.on('request', this.lifecycle.bind(this));

    const listener = ServerUtils.Tools.listener(opts, listeningListener);
    if (opts.logger) {
      ServerUtils.Tools.log(opts);
    }
    if (opts.path) {
      this.listen(opts.path, opts.backlog, listener);
    } else {
      this.listen(opts.port, opts.host, opts.backlog, listener);
    }
    return this;
  }
  async load(paths: string = './*.ts') {
    await LoadModules.load(paths);
  }
}
export const g = new WebServer();
