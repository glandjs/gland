import { IncomingMessage, Server, ServerResponse } from 'http';
import { Parser } from '../helper/parser';
import { Gland } from '../types/gland';
import { ServerUtils } from '../helper';
import { WebContext } from './context';
import { Router } from './router';
import { LoadModules } from '../helper/load';
import { Context } from '../types/types';
import { METHODS } from 'http';
import { midManager, Static } from './middleware';

export class WebServer extends Server implements Gland.Listener, Gland.APP {
  private middlewares: Gland.Middleware[] = [];
  private engines: { [ext: string]: Gland.Engine } = {};
  private settings: { [key: string]: any } = {};

  constructor() {
    super();
  }
  static(root: string): this {
    this.use(Static.serve(root));
    return this;
  }
  use(path: string | Gland.Middleware, ...handlers: (Gland.Middleware | Gland.Middleware[])[]): this {
    midManager.process(path, handlers, this.middlewares);
    return this;
  }
  engine(ext: string, callback: Gland.Engine): this {
    ext = ext.startsWith('.') ? ext : `.${ext}`;
    this.engines[ext] = callback;
    return this;
  }

  set(name: string, value?: any): this {
    this.settings[name] = value;
    return this;
  }

  get(name: string): any {
    return this.settings[name];
  }

  all(path: string, ...handlers: Gland.RouteHandler[]): this {
    METHODS.forEach((method) => {
      // Register each handler for all HTTP methods
      handlers.forEach((handler) => {
        Router.set(handler as any, path);

        this.middlewares.push(async (ctx: Context, next: () => Promise<void>) => {
          if (ctx.url!.startsWith(path) && ctx.method === method) {
            await handler(ctx);
            if (ctx.writableEnded) {
              return;
            }
          }
          await next();
        });
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
