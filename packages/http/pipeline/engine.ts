import { isNil } from '@medishn/toolkit';
import { HttpContext, IPipelineEngine } from '../interface';
import { HttpEventCore } from '../adapter/http-events';
import { RouterChannel } from '../router/channel';
import { PipelineChannel } from './channel';
import { MiddlewareChannel } from '../middleware';

export class PipelineEngine implements IPipelineEngine {
  constructor(
    _channel: PipelineChannel,
    private _events: HttpEventCore,
    private _router: RouterChannel,
    private _middleware: MiddlewareChannel,
  ) {
    _channel.onExecute(this.execute.bind(this));
  }

  public async execute(ctx: HttpContext): Promise<void> {
    const path = ctx.url!;
    const resolver = this._middleware.createResolver();
    const route = this._router.match(ctx);
    if (isNil(route)) {
      this._events.safeEmit('$router:miss', ctx);
      return;
    }
    ctx.params = route.params;
    await resolver.execute(ctx, path, async () => {
      const result = await route.action(ctx);
      ctx.body = result;
      ctx.status = ctx.status ?? 200;
      if (!ctx.replied) {
        ctx.send(ctx.body);
      }
    });
  }
}
