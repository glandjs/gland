import { ServerUtils } from '../../helper';
import { Context, MidsFn } from '../../types';
import { Gland } from '../../types/gland';
import { Router } from '../router';
export namespace Gmid {
  let mids: MidsFn[] = [];

  export function set(middleware: MidsFn | MidsFn[]) {
    mids = [...mids, ...ServerUtils.normalize(middleware)];
  }

  export function get(): MidsFn[] | [] {
    return mids || [];
  }
}
export namespace midManager {
  export function process(path: string | Gland.Middleware, handlers: (Gland.Middleware | Gland.Middleware[])[], middlewares: Gland.Middleware[]) {
    // If the first argument is a string, treat it as a path
    if (typeof path === 'string') {
      handlers.flat().forEach((handler) => {
        // Register the handler with a set method in Router
        Router.set(handler as any, path);

        // Add the middleware directly to the stack without unnecessary wrapping
        if (handler.length === 2 || handler.length === 3) {
          middlewares.push(async (ctx: Context, next: () => Promise<void>) => {
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
          middlewares.push(handler as Gland.GlandMiddleware);
        } else {
          throw new Error('Invalid middleware/handler function signature');
        }
      });
    } else {
      // Handle when path is not a string
      const allMiddlewares = [path, ...handlers].flat();
      const uniqueMiddlewares = Array.from(new Set(allMiddlewares));
      middlewares.push(...uniqueMiddlewares);
    }
  }
}
