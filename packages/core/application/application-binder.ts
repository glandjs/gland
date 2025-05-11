import type { Logger } from '@medishn/toolkit';
import type { Explorer } from '../injector';
import type { TGlandBroker } from '../types';

export class ApplicationBinder {
  private readonly logger?: Logger;
  private readonly map: Map<
    string,
    {
      namespace: string;
      event: string;
      fullEvent: string;
    }
  > = new Map();
  constructor(
    private explorer: Explorer,
    private broker: TGlandBroker,
    logger?: Logger,
  ) {
    this.logger = logger?.child('Binder');
  }
  bind(): void {
    this.logger?.debug('Starting controller/channel binding...');
    this.bindChannel();
    this.bindControllers();
    this.logger?.info('- Done.');
  }
  bindChannel() {
    const channels = this.explorer.exploreChannels();
    for (const channel of channels) {
      const { instance, event, namespace, target } = channel;
      const fullEvent = `gland:define:channel:${namespace}:${event}` as `gland:define:channel:${string}:${string}`;

      this.broker.on(fullEvent, async (...args: any[]) => {
        this.logger?.debug(`[Broker] Invoking channel handler [${namespace}:${event}]`);
        return await target.apply(instance, args);
      });
      this.map.set(fullEvent, {
        namespace,
        event,
        fullEvent,
      });
      this.logger?.info(`Channel bound: namespace="${namespace}", event="${event}"`);
    }
  }
  public bindControllers(): void {
    const controllers = this.explorer.exploreControllers();
    for (const controller of controllers) {
      const { method, route, controller: ctr } = controller;
      const fullPath = this.combinePaths(ctr.path, route);
      this.logger?.debug(`Binding route [${method.toUpperCase()} ${fullPath}] to method "${ctr.methodName}"`);

      this.broker.broadcast('gland:define:route', {
        path: route,
        meta: {
          method: ctr.methodName,
          path: fullPath,
        },
        method,
        action: (ctx) => {
          this.logger?.debug(`[Broker] Executing action for ${method.toUpperCase()} ${fullPath}`);
          ctx.state = ctx._state || {};
          ctx.state.brokerId = this.broker.id;
          ctx.state.channel = Array.from(this.map.values());
          return ctr.target(ctx);
        },
      });
      this.logger?.info(`Controller route bound: [${method.toUpperCase()}] ${fullPath}`);
    }
  }
  private combinePaths(basePath: string, methodPath: string): string {
    basePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
    basePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    methodPath = methodPath.startsWith('/') ? methodPath : `/${methodPath}`;
    return `${basePath}${methodPath}`;
  }
}
