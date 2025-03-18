import { HttpContext } from '../interface';
import { HttpEventCore } from '../adapter';
enum PipelineEvent {
  EXECUTE = 'execute',
}

export class PipelineChannel {
  constructor(private channel: HttpEventCore) {}

  onExecute(handler: (ctx: HttpContext) => Promise<void>) {
    this.channel.on(PipelineEvent.EXECUTE, async (ctx: HttpContext) => {
      await handler(ctx);
    });
  }

  execute(ctx: HttpContext): void {
    this.channel.emit(PipelineEvent.EXECUTE, ctx);
  }
}
