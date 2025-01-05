import { HttpContext } from 'node:http';
import { AppSettings } from '../core/AppSettings';
import { MiddlewareFn } from './Middleware.interface';
export class Middleware extends AppSettings {
  private _stack: MiddlewareFn[] = [];
  constructor() {
    super();
  }
  get middlewares(): MiddlewareFn[] {
    return this._stack;
  }

  new(...middlewares: MiddlewareFn[]): void {
    this._stack.push(...middlewares);
  }
  async execute(ctx: HttpContext, next: Function) {
    let idx = 0;

    const nextMiddleware = async () => {
      if (idx < this._stack.length) {
        const middleware = this._stack[idx++];
        console.log('this._stack', this._stack);
        console.log('middleware', middleware);
        console.log('middleware:STRING', middleware.toString());
        middleware(ctx, nextMiddleware);
      } else {
        await next(ctx);
      }
    };

    await nextMiddleware();
  }
}
