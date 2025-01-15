import { ServerRequest } from '../common/interfaces';
import { MiddlewareFn } from '../common/types';

export class MiddlewareStack {
  private readonly middlewares: MiddlewareFn[] = [];

  use(...middlewares: MiddlewareFn[]): void {
    if (!middlewares || middlewares.some((mw) => typeof mw !== 'function')) {
      throw new Error('Invalid middleware provided. Each middleware must be a function.');
    }
    this.middlewares.push(...middlewares);
  }
  async execute(ctx: ServerRequest, action: Function): Promise<void> {
    let index = 0;
    const next = async () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(ctx, next);
      } else {
        await action(ctx);
      }
    };

    await next();
  }

  getStack(): MiddlewareFn[] {
    return [...this.middlewares];
  }
}
