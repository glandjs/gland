import { NextFunction } from '@gland/common';
import { HttpContext, Pipeline } from '../../interface';

export class ResponsePipeline implements Pipeline {
  constructor() {}

  async process(ctx: HttpContext, next: NextFunction): Promise<void> {
    ctx.status = ctx.status ?? 200;
    ctx.send(ctx.body);
    await next();
  }
}
