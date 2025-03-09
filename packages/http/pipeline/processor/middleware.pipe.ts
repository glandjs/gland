import { NextFunction } from '@gland/common';
import { HttpContext, Pipeline } from '../../interface';
import { MiddlewareChannel } from '../../middleware';

export class MiddlewarePipeline implements Pipeline {
  constructor(private readonly middlewareChannel: MiddlewareChannel) {}
  async process(ctx: HttpContext, next: NextFunction): Promise<void> {
    const path = ctx.url!;

    await this.middlewareChannel.createResolver().execute(ctx, path, next);

    await next();
  }
}
