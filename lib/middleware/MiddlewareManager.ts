import { HttpContext } from 'node:http';
import { MiddlewareStack } from './MiddlewareStack';
import { MiddlewareFn } from '../common/interface/middleware.interface';

export class MiddlewareManager {
  private readonly stack: MiddlewareStack;

  constructor() {
    this.stack = new MiddlewareStack();
  }
  use(...middlewares: MiddlewareFn[]): void {
    this.stack.add(...middlewares);
  }
  async run(ctx: HttpContext, next: Function): Promise<void> {
    await this.stack.execute(ctx, next);
  }
}
