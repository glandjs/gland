import { HttpContext } from 'node:http';
import { MiddlewareFn } from '../common/interface/middleware.interface';
export class MiddlewareStack {
  private readonly middlewares: MiddlewareFn[] = [];

  /**
   * Adds middleware functions to the stack.
   * @param middlewares Middleware functions to add.
   */
  add(...middlewares: MiddlewareFn[]): void {
    if (!middlewares || middlewares.some((mw) => typeof mw !== 'function')) {
      throw new Error('Invalid middleware provided. Each middleware must be a function.');
    }
    this.middlewares.push(...middlewares);
  }

  /**
   * Executes middleware in the order they were added.
   * @param ctx The HTTP context.
   * @param next The next function to call if the stack completes.
   */
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

  /**
   * Retrieves the current stack of middleware functions.
   * @returns An array of middleware functions.
   */
  getStack(): MiddlewareFn[] {
    return [...this.middlewares];
  }
}
