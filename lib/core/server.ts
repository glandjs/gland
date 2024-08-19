import { IncomingMessage, Server, ServerResponse } from 'http';
import { Parser } from '../helper/parser';
import { Gland } from '../types/gland';
import { ServerUtils } from '../helper';
import { WebContext } from './context';
import { Router } from './router';
import { LoadModules } from '../helper/load';
export class WebServer extends Server implements Gland.Listener, Gland.APP {
  private middlewares: Gland.Middleware[] = [];
  private settings: Record<string, any> = {};
  private viewEngines: Record<string, Gland.ViewEngineCallback> = {};
  constructor() {
    super();
  }
  use(path: string | Gland.Middleware, ...handlers: (Gland.Middleware | Gland.Middleware[])[]): this {
    // If the first argument is a string, treat it as a path
    if (typeof path === 'string') {
      handlers.flat().forEach((handler) => {
        // Register the handler with a set method in Router
        Router.set(handler as any, path);

        // Add the middleware to the stack
        this.middlewares.push(async (ctx, next) => {
          if (ctx.url.startsWith(path)) {
            await handler(ctx, next);
          } else {
            await next();
          }
        });
      });
    } else {
      // If the first argument is not a string, treat it as a middleware
      const middlewares = [path, ...handlers].flat() as Gland.Middleware[];
      this.middlewares.push(...middlewares);
    }
    return this;
  }
  set(setting: string, value: any): this {
    this.settings[setting] = value;
    return this;
  }

  engine(ext: string, callback: Gland.ViewEngineCallback): this {
    this.viewEngines[ext] = callback;
    return this;
  }

  all(path: string, ...handlers: Gland.RouteHandler[]): this {
    handlers.forEach((handler) => {
      this.use(path, handler);
    });
    return this;
  }

  // CORS method to handle Cross-Origin Resource Sharing
  cors(options: Gland.CorsOptions = {}): this {
    const corsMiddleware: Gland.Middleware = (ctx, next) => {
      ctx.res.setHeader('Access-Control-Allow-Origin', options.origin || '*');
      ctx.res.setHeader('Access-Control-Allow-Methods', options.methods || 'GET, POST, PUT, DELETE, OPTIONS');
      ctx.res.setHeader('Access-Control-Allow-Headers', options.headers || 'Content-Type, Authorization');
      if (ctx.req.method === 'OPTIONS') {
        ctx.res.writeHead(204);
        ctx.res.end();
      } else {
        return next();
      }
    };
    this.use(corsMiddleware);
    return this;
  }
  private async lifecycle(req: IncomingMessage, res: ServerResponse) {
    const { ctx } = new WebContext(req, res);
    const { method, path, url, base } = await Parser.Request(req);
    const matchingRoute = Router.findMatch(path, method, base);
    if (matchingRoute) {
      const { controller, handlerKey, params } = matchingRoute;
      ctx.query = Object.fromEntries(url.searchParams.entries());
      ctx.params = params;
      // Check if the controller is a class or a function
      if (typeof controller === 'function' && !handlerKey) {
        // Handle function-based middleware or controller directly
        const middlewareStack = [...this.middlewares, controller];
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
