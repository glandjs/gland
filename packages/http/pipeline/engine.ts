import { Constructor, Logger } from '@medishn/toolkit';
import { DependencyContainer } from './dependency-container';
import { StageRegistry } from './stage-registry';
import { HttpContext, IPipelineEngine, Pipeline, StageConfiguration } from '../interface';
import { HttpEventCore } from '../adapter/http-events';
import { RouterChannel } from '../router/channel';
import { PipelineChannel } from './channel';
import { MiddlewareChannel } from '../middleware';

export class PipelineEngine implements IPipelineEngine {
  private _stages: Pipeline[] = [];
  private _initialized = false;
  private _executionChain: ((ctx: HttpContext) => Promise<void>) | null = null;
  private _registry: StageRegistry;
  private readonly logger = new Logger({
    context: 'HTTP:Pipeline',
  });
  constructor(_channel: PipelineChannel, _base: HttpEventCore, private _router: RouterChannel, private _middleware: MiddlewareChannel) {
    this._registry = new StageRegistry();

    _channel.onExecute(this.execute.bind(this));
    _channel.onRegister(({ pipeline, configuration }) => {
      this.registerStage(pipeline, configuration);
    });
  }

  public registerStage(pipeline: Constructor, configuration: Partial<StageConfiguration> = {}): void {
    const instance = new pipeline();
    if (this._initialized) {
      throw new Error('Cannot modify pipeline after initialization');
    }

    this._registry.registry[instance.constructor.name] = {
      priority: configuration.priority ?? 500,
      factory: () => instance,
    };
    this.logger.warn('HELLO FROM REGISTRy');
  }

  public async execute(ctx: HttpContext): Promise<void> {
    if (!this._initialized) {
      await this.initialize();
    }
    if (!this._executionChain) {
      throw new Error('Execution chain not properly initialized');
    }

    try {
      await this._executionChain(ctx);
    } catch (error) {
      this.logger.error('Unhandled error in request processing', {
        error,
        url: ctx.url,
        method: ctx.method,
        message: error.message,
      });

      if (!ctx.responded) {
        ctx.status = 500;
        ctx.send({ error: 'Internal Server Error' });
      }
    }
  }
  private async initialize(): Promise<void> {
    if (this._initialized) return;

    try {
      const dependencies = this.buildDependencyContainer();
      const stages = await this._registry.createStages(dependencies);

      this._stages = this._registry.orderByPriority(stages);
      this._executionChain = this.buildExecutionChain();
      this._initialized = true;

      this.logger.info(`Request processor initialized with ${this._stages.length} stages: ${this._stages.map((p) => p.constructor.name).join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to initialize HTTP processing chain', error);
      throw error;
    }
  }

  private buildDependencyContainer(): DependencyContainer {
    const container = new DependencyContainer();
    container.register('router', this._router);
    container.register('middleware', this._middleware);

    return container;
  }

  private buildExecutionChain(): (ctx: HttpContext) => Promise<void> {
    type ProcessingFn = (ctx: HttpContext) => Promise<void>;
    const finalStage: ProcessingFn = async () => {};

    const composedFnCache = new Map<Pipeline, (ctx: HttpContext) => Promise<void>>();

    return this._stages.reduceRight((nextFn, stage) => {
      if (composedFnCache.has(stage)) {
        return composedFnCache.get(stage)!;
      }

      const stageFn = async (ctx: HttpContext) => {
        if (ctx.responded) return;
        try {
          await this.createStageWrapper(stage, this.logger)(ctx, async () => {
            await nextFn(ctx);
          });
        } catch (error) {
          throw error;
        }
      };
      composedFnCache.set(stage, stageFn);
      return stageFn;
    }, finalStage);
  }

  private createStageWrapper(stage: Pipeline, logger: Logger): (ctx: HttpContext, next: () => Promise<void>) => Promise<void> {
    return async (ctx: HttpContext, next: () => Promise<void>) => {
      let nextCalled = false;

      const wrappedNext = async () => {
        nextCalled = true;
        await next();
      };

      try {
        await stage.process(ctx, wrappedNext);

        if (!nextCalled) {
          logger.warn(`Next not called in stage: ${stage.constructor.name}`);
        }
      } catch (error) {
        throw error;
      }
    };
  }
}
