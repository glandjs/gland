import { ServerUtils } from '../../helper';
import { Context, MidsFn } from '../../types/types';
import { Gland } from '../../types/gland';
import { Router } from '../router';
import { join, resolve } from 'path';
import { createReadStream, existsSync, statSync } from 'fs';

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
      // If the first argument is not a string, treat it as a middleware
      const middlewares = [path, ...handlers].flat() as Gland.Middleware[];
      middlewares.push(...middlewares);
    }
  }
}

export namespace Static {
  export function serve(root: string): Gland.Middleware {
    const absoluteRoot = resolve(root);
    console.log('absoluteRoot:', absoluteRoot);

    return async (ctx: Context, next: () => Promise<void>) => {
      try {
        // Ensure the URL is correctly parsed and cleaned
        const requestedPath = ctx.url! || '/';
        console.log('requestedPath:', requestedPath);

        const filePath = resolve(join(absoluteRoot, requestedPath));
        console.log('filePath:', filePath);

        // Prevent path traversal attacks
        if (!filePath.startsWith(absoluteRoot)) {
          console.log('Path traversal attempt detected');
          await next();
          return;
        }

        // Check if the file exists and is a file
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          const stat = statSync(filePath);
          console.log('File found:', filePath);

          // Set the appropriate headers
          ctx.rs.setHeader('Content-Type', ServerUtils.getContentType(filePath));
          ctx.rs.setHeader('Content-Length', stat.size);
          ctx.rs.setHeader('Last-Modified', stat.mtime.toUTCString());

          // Handle ETag and If-None-Match for caching
          const etag = ServerUtils.generateETag(stat);
          ctx.rs.setHeader('ETag', etag);
          if (ctx.rq.headers['if-none-match'] === etag) {
            ctx.rs.writeHead(304);
            ctx.rs.end();
            return;
          }

          // Stream the file to the response
          const stream = createReadStream(filePath);
          stream.pipe(ctx.rs);
        } else {
          console.log('File not found, proceeding to next middleware');
          await next(); // File not found, proceed to next middleware
        }
      } catch (error) {
        console.error('Error in static middleware:', error);
        await next(); // On error, proceed to next middleware
      }
    };
  }
}
