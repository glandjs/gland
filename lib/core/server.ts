import { IncomingMessage, Server, ServerResponse } from 'http';
import { Parser } from '../helper/parser';
import { Gland } from '../types/gland';
import { ServerUtils } from '../helper';
import { WebContext } from './context';
import { Router } from './router';
import { LoadModules } from '../helper/load';
import { Context, StaticOptions } from '../types/types';
import { METHODS } from 'http';
import { stat } from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';

export class WebServer extends Server implements Gland.Listener, Gland.APP {
  private middlewares: Gland.Middleware[] = [];
  private engines: { [ext: string]: Gland.Engine } = {};
  private settings: { [key: string]: any } = {};
  constructor() {
    super();
  }
  static(root: string, options: StaticOptions = {}): this {
    const defaultOptions: StaticOptions = {
      index: 'index.html',
      etag: true,
      lastModified: true,
      maxAge: 0,
      cacheControl: true,
      dotfiles: 'ignore',
    };

    const opts = { ...defaultOptions, ...options };

    this.middlewares.push(async (req: IncomingMessage & { url: string }, res: ServerResponse, next: Function) => {
      let filePath = join(root, req.url!);

      try {
        const fileStat = await stat(filePath);

        if (fileStat.isDirectory()) {
          if (opts.index === false) return next();

          filePath = join(filePath, opts.index as string);
          try {
            await stat(filePath);
          } catch {
            return next();
          }
        }

        if (opts.dotfiles === 'deny' && filePath.includes('/.')) {
          res.statusCode = 403;
          return res.end('Forbidden');
        } else if (opts.dotfiles === 'ignore' && filePath.includes('/.')) {
          return next();
        }

        // Set headers
        if (opts.lastModified) {
          res.setHeader('Last-Modified', fileStat.mtime.toUTCString());
        }

        if (opts.cacheControl) {
          res.setHeader('Cache-Control', `public, max-age=${Math.floor(opts.maxAge! / 1000)}`);
        }

        if (opts.etag) {
          const etag = ServerUtils.generateETag(fileStat);
          res.setHeader('ETag', etag);

          if (req.headers['if-none-match'] === etag) {
            res.statusCode = 304;
            return res.end();
          }
        }

        // Serve the file
        const fileStream = createReadStream(filePath);
        res.statusCode = 200;
        res.setHeader('Content-Type', ServerUtils.getContentType(filePath));
        fileStream.pipe(res);
      } catch (err) {
        next();
      }
    });

    return this;
  }

  use(path: string | Gland.Middleware, ...handlers: (Gland.Middleware | Gland.Middleware[])[]): this {
    // If the first argument is a string, treat it as a path
    if (typeof path === 'string') {
      handlers.flat().forEach((handler) => {
        // Register the handler with a set method in Router
        Router.set(handler as any, path);

        // Add the middleware directly to the stack without unnecessary wrapping
        if (handler.length === 2 || handler.length === 3) {
          this.middlewares.push(async (ctx: Context, next: () => Promise<void>) => {
            if (ctx.url!.startsWith(path)) {
              if (handler.length === 2) {
                await (handler as Gland.GlandMiddleware)(ctx, next);
              } else if (handler.length === 3) {
                await new Promise<void>((resolve, reject) => {
                  (handler as Gland.ExpressMiddleware)(ctx.rq, ctx.rs, (err?: any) => {
                    if (err) reject(err);
                    else resolve();
                  });
                });
              } else {
                throw new Error('Invalid middleware/handler function signature');
              }
            } else {
              await next();
            }
          });
        } else if (handler.length === 1) {
          this.middlewares.push(handler as Gland.GlandMiddleware);
        } else {
          throw new Error('Invalid middleware/handler function signature');
        }
      });
    } else {
      // If the first argument is not a string, treat it as a middleware
      const middlewares = [path, ...handlers].flat() as Gland.Middleware[];
      this.middlewares.push(...middlewares);
    }
    return this;
  }
  engine(ext: string, callback: Gland.Engine): this {
    // Ensure extension starts with a dot
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
