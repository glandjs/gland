import { IncomingMessage, Server, ServerResponse, METHODS } from 'http';
import { Parser } from '../helper/Parser';
import { Gland, ListenArgs, ModuleConfig, NxtFunction } from '../types';
import { ServerUtils } from '../helper';
import { WebContext } from './context';
import { Router } from './router';
import { LoadModules } from '../helper/load';
import { Context } from '../types';
import { midManager } from './middleware';
import { Queue, QueueOptions } from '../helper/Queue';

export class WebServer extends Server implements Gland.APP {
  private middlewares: Gland.Middleware[] = [];
  private taskQueue: Queue;
  private defaultQueueOptions: QueueOptions = { maxConcurrent: 10, cacheSize: 1000 };
  private taskCounter = 0;
  constructor(queueOptions?: QueueOptions) {
    super();
    this.taskQueue = new Queue({ ...this.defaultQueueOptions, ...queueOptions });
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
          const middleware = async (ctx: Context, next: NxtFunction) => {
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

    const taskId = `${method}:${path}:${Date.now()}:${this.taskCounter++}`;
    const task = async () => {
      if (matchingRoute) {
        const { controller, handlerKey, params } = matchingRoute;
        ctx.query = Object.fromEntries(url.searchParams.entries());
        ctx.params = params;
        ctx.body = await ctx.json();
        if (typeof controller === 'function' && !handlerKey) {
          const middlewareStack = Array.from(new Set([...this.middlewares, controller]));
          await Router.execute(ctx, middlewareStack);
        } else {
          const routeInstance = new controller();
          await Router.run(ctx, routeInstance, method, handlerKey, this.middlewares);
        }
      }
    };
    await this.taskQueue.add(task, taskId);
  }
  listen(...args: ListenArgs): this {
    let port: number | undefined;
    let host: string | undefined;
    let backlog: number | undefined;
    let listener: (() => void) | undefined;

    if (typeof args[0] === 'object' && args[0] !== null && !(args[0] instanceof Function)) {
      const opts = args[0] as Gland.ListenOptions;
      port = opts.port ?? 3000;
      host = opts.host ?? 'localhost';
      backlog = opts.backlog;
      listener = args[1] as (() => void) | undefined;

      if (opts.logger) {
        ServerUtils.Tools.log(opts);
      }
    } else {
      if (typeof args[0] === 'number') port = args[0];
      if (typeof args[1] === 'string') host = args[1];
      if (typeof args[1] === 'number') backlog = args[1];
      if (typeof args[2] === 'number') backlog = args[2];
      if (typeof args[1] === 'function') listener = args[1];
      if (typeof args[2] === 'function') listener = args[2];
      if (typeof args[3] === 'function') listener = args[3];
    }

    this.on('request', this.lifecycle.bind(this));

    if (typeof args[0] === 'string') {
      super.listen(args[0], backlog, listener);
    } else {
      super.listen(port, host, backlog, listener);
    }

    return this;
  }
  init(...args: ListenArgs): this {
    return this.listen(...args);
  }
  async load(conf: string) {
    await LoadModules.load(conf);
  }
}
