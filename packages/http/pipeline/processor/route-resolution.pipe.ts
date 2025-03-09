import { NextFunction } from '@gland/common';
import { HttpContext, Pipeline } from '../../interface';
import { isNil } from '@medishn/toolkit';
import { RouterChannel } from '@gland/http/router/channel';

export class RouteResolutionPipeline implements Pipeline {
  constructor(private _routerChannel: RouterChannel) {}

  async process(ctx: HttpContext, next: NextFunction): Promise<void> {
    const route = this._routerChannel.match(ctx);

    if (isNil(route)) {
      await next();
      return;
    }
    ctx.params = route.params;
    const result = route && (await route.action(ctx));
    ctx.body = result;
    await next();
  }
}
