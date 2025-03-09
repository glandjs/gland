import { Pipeline, StageConfiguration } from '../interface';
import { DependencyContainer } from './dependency-container';
import { MiddlewarePipeline, ResponsePipeline, RouteResolutionPipeline } from './processor';
import { MiddlewareChannel } from '../middleware';
import { RouterChannel } from '../router/channel';

export type StageRegistryPipeline = Record<string, { priority: number; factory: StageFactory }>;
type StageFactory = (dependencies: DependencyContainer) => Pipeline | Promise<Pipeline>;

export class StageRegistry {
  public registry: StageRegistryPipeline = {
    MiddlewarePipeline: {
      priority: 50,
      factory: (deps) => {
        const resolver = deps.resolve<MiddlewareChannel>('middleware');
        return new MiddlewarePipeline(resolver);
      },
    },
    RouteResolutionPipeline: {
      priority: 100,
      factory: (deps) => {
        const channel = deps.resolve<RouterChannel>('router');
        return new RouteResolutionPipeline(channel);
      },
    },
    ResponsePipeline: {
      priority: Infinity,
      factory: () => {
        return new ResponsePipeline();
      },
    },
  };

  public orderByPriority(stages: Pipeline[]) {
    return stages.sort((a, b) => {
      const nameA = a.constructor.name;
      const nameB = b.constructor.name;

      const priorityA = this.getStageConfiguration(nameA).priority;
      const priorityB = this.getStageConfiguration(nameB).priority;

      return priorityA - priorityB;
    });
  }

  public async createStages(dependencies: DependencyContainer) {
    const enabledStages = Object.entries(this.registry);

    const stagePromises = enabledStages.map(async ([name, config]) => {
      try {
        return await config.factory(dependencies);
      } catch (error) {
        return null;
      }
    });

    const createdStages = await Promise.all(stagePromises);
    return createdStages.filter(Boolean) as Pipeline[];
  }

  private getStageConfiguration(stageName: string): StageConfiguration {
    return stageName in this.registry ? this.registry[stageName] : { priority: 1000 };
  }
}
