import { NextFunction } from '@glandjs/common';
import { HttpContext } from '../interface';
import { MiddlewareChannel } from './channel';

export class MiddlewareResolver {
  constructor(private channel: MiddlewareChannel) {}

  async execute(ctx: HttpContext, path: string, finalHandler: NextFunction): Promise<void> {
    const middlewares = this.channel.resolve({ path, method: ctx.req.method });

    if (middlewares.length === 0) {
      await finalHandler();
      return;
    }

    let index = -1;
    const dispatch = async (i: number): Promise<void> => {
      // Prevent multiple next() calls
      if (i <= index) {
        throw new Error('Middleware next() called multiple times');
      }

      index = i;
      const middleware = middlewares[i];

      if (middleware) {
        await middleware(ctx, () => dispatch(i + 1));
      } else {
        await finalHandler();
      }
    };

    try {
      await dispatch(0);
    } catch (error) {
      throw error;
    }
  }
}
