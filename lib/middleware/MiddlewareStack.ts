import { MiddlewareFn } from '../common/interface/middleware.interface';
import { HttpContext } from '../types';
export class MiddlewareStack {
  private readonly middlewares: MiddlewareFn[] = [];

  add(...middlewares: MiddlewareFn[]): void {
    if (!middlewares || middlewares.some((mw) => typeof mw !== 'function')) {
      throw new Error('Invalid middleware provided. Each middleware must be a function.');
    }
    this.middlewares.push(...middlewares);
  }
  async execute(ctx: HttpContext, next: Function): Promise<void> {
    let index = 0;

    const invokeNext = async () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        try {
          await middleware(ctx, invokeNext);
        } catch (err) {
          console.error('Middleware execution error:', err);
          throw err;
        }
      } else {
        await next(ctx);
      }
    };

    await invokeNext();
  }

  getStack(): MiddlewareFn[] {
    return [...this.middlewares];
  }
}
