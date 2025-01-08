import { MiddlewareStack } from './MiddlewareStack';
import { MiddlewareFn } from '../common/interface/middleware.interface';
import { HttpContext } from '../types';

export class MiddlewareManager {
  private readonly stack: MiddlewareStack;

  constructor() {
    this.stack = new MiddlewareStack();
  }
  use(...middlewares: MiddlewareFn[]): void {
    this.stack.push(...middlewares);
  }
  async run(ctx: HttpContext, action: Function): Promise<void> {
    await this.stack.execute(ctx, action);
  }
}
