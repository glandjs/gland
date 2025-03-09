import { NextFunction } from '@gland/common';
import { AnyMiddleware, ExpressLikeMiddleware, GlandMiddleware, HttpContext } from '../interface';
import { isFunction, isString } from '@medishn/toolkit';
import { MiddlewareChannel } from './channel';

export class MiddlewareAdapter {
  constructor(private readonly channel: MiddlewareChannel) {}
  use(...args: [GlandMiddleware] | [ExpressLikeMiddleware] | [string, AnyMiddleware]): void {
    const [firstArg, secondArg] = args;
    if (isString(firstArg) && secondArg) {
      const middleware = this.normalizeMiddleware(secondArg as AnyMiddleware);
      this.channel.register({
        middleware: [middleware],
        routes: [{ path: firstArg }],
      });
      return;
    }

    const middleware = args[0] as AnyMiddleware;
    const wrapped = this.normalizeMiddleware(middleware);
    this.channel.applyGlobal(wrapped);
  }
  private normalizeMiddleware(middleware: AnyMiddleware): GlandMiddleware {
    if (!this.isExpressMiddleware(middleware)) {
      return middleware as GlandMiddleware;
    }

    return this.wrapExpressMiddleware(middleware);
  }

  private isExpressMiddleware(middleware: any): middleware is ExpressLikeMiddleware {
    return isFunction(middleware) && middleware.length === 3;
  }

  private wrapExpressMiddleware(middleware: ExpressLikeMiddleware): GlandMiddleware {
    return async (ctx: HttpContext, next: NextFunction) => {
      return new Promise((resolve, reject) => {
        const handleNext = (err?: unknown) => {
          err ? reject(err) : resolve(next());
        };

        try {
          middleware(ctx.req, ctx.res, handleNext);
        } catch (syncError) {
          reject(syncError);
        }
      });
    };
  }
}
