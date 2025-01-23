import { Context } from '@medishn/gland/common/interfaces';
import { MiddlewareFunction, NextFunction } from '@medishn/gland/common/types';

export class MiddlewarePipeline {
  private readonly middlewares: MiddlewareFunction[] = [];

  add(...middlewares: MiddlewareFunction[]): void {
    if (!middlewares || middlewares.some((mw) => typeof mw !== 'function')) {
      throw new Error('Invalid middleware provided. Each middleware must be a function.');
    }
    for (const middleware of middlewares) {
      if (!this.middlewares.includes(middleware)) {
        this.middlewares.push(middleware);
      }
    }
  }
  async execute(ctx: Context, finalHandler: (ctx: Context) => void | Promise<void>): Promise<void> {
    if (typeof finalHandler !== 'function') {
      throw new Error('Final handler must be a valid function.');
    }
    let index = 0;
    const executeNext: NextFunction = async () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(ctx, executeNext);
      } else {
        await finalHandler(ctx);
      }
    };

    await executeNext();
  }
}
