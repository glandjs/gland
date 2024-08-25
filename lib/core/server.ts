import { IncomingMessage, Server, ServerResponse, METHODS } from 'http';
import { Parser } from '../helper/parser';
import { Gland } from '../types/gland';
import { ServerUtils } from '../helper';
import { WebContext } from './context';
import { Router } from './router';
import { LoadModules } from '../helper/load';
import { Context } from '../types';
import { midManager } from './middleware';
export class WebServer extends Server implements Gland.Listener, Gland.APP {
  private middlewares: Gland.Middleware[] = [];
  constructor() {
    super();
  }
  use(path: string | Gland.Middleware, ...handlers: (Gland.Middleware | Gland.Middleware[])[]): this {
    midManager.process(path, handlers, this.middlewares);
    return this;
  }
  all(path: string, ...handlers: Gland.RouteHandler[]): this {
    const uniqueHandlers = new Set<Gland.RouteHandler>(handlers);

    METHODS.forEach((method) => {
      uniqueHandlers.forEach((handler) => {
        const middlewareKey = `${method}:${path}:${handler.toString()}`;
        const isAlreadyAdded = this.middlewares.some((middleware) => (middleware as any).key === middlewareKey);

        if (!isAlreadyAdded) {
          const middleware = async (ctx: Context, next: () => Promise<void>) => {
            if (ctx.url!.startsWith(path) && ctx.method === method) {
              await handler(ctx);
              if (ctx.writableEnded) {
                return;
              }
            }
            await next();
          };

          middleware.key = middlewareKey;
          Router.set(handler as any, path);
          this.middlewares.push(middleware);
        }
      });
    });

    return this;
  }
  private async lifecycle(req: IncomingMessage, res: ServerResponse) {
    (res as any).server = this;
    const { ctx } = new WebContext(req, res);
    const { method, path, url, base } = await Parser.Request(req);
    const matchingRoute = Router.findMatch(path, method, base);
    if (matchingRoute) {
      const { controller, handlerKey, params } = matchingRoute;
      ctx.query = Object.fromEntries(url.searchParams.entries());
      ctx.params = params;
      // Check if the controller is a class or a function
      if (typeof controller === 'function' && !handlerKey) {
        const middlewareStack = Array.from(new Set([...this.middlewares, controller]));
        // Logging the function names or sources to help identify duplication
        await Router.execute(ctx, middlewareStack);
      } else {
        const routeInstance = new controller();
        await Router.run(ctx, routeInstance, method, handlerKey, this.middlewares);
      }
    }
  }
  init(opts: Gland.ListenOptions = {}, listeningListener?: (info: Gland.ListenOptions) => void): Server {
    // Assign default values if not provided by the user
    opts.port ??= 3000;
    opts.host ??= 'localhost';
    opts.logger ??= true;
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
