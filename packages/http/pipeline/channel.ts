import { Constructor } from '@medishn/toolkit';
import { HttpContext, StageConfiguration } from '../interface';
import { HttpEventCore } from '../adapter';
enum PipelineEvent {
  EXECUTE = 'execute',
  REGISTER = 'register',
}

type RegisterPipelineType = {
  pipeline: Constructor;
  configuration: Partial<StageConfiguration>;
};

export class PipelineChannel {
  constructor(private channel: HttpEventCore) {}

  onExecute(handler: (ctx: HttpContext) => Promise<void>) {
    this.channel.on(PipelineEvent.EXECUTE, async (ctx: HttpContext) => {
      await handler(ctx);
    });
  }

  onRegister(handler: (data: RegisterPipelineType) => void) {
    this.channel.on<RegisterPipelineType>(PipelineEvent.REGISTER, (data) => {
      handler(data);
    });
  }

  execute(ctx: HttpContext): void {
    this.channel.emit(PipelineEvent.EXECUTE, ctx);
  }

  register(pipeline: Constructor, configuration: Partial<StageConfiguration> = {}): void {
    this.channel.emit(PipelineEvent.REGISTER, { pipeline, configuration });
  }
}
