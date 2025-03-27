import { Logger } from '@medishn/toolkit';
import type { Broker } from '@glandjs/events';
import type { Explorer } from './explorer';

export class AppBinder {
  constructor(
    private explorer: Explorer,
    private broker: Broker,
  ) {}
  bind(): void {
    this.bindControllers();
  }

  public bindControllers(): void {
    const routes = this.explorer.exploreControllers();
    const channelHandlers = this.explorer.exploreChannel();
    const channels = new Map<
      string,
      {
        namespace: string;
        event: string;
        fullEvent: string;
      }
    >();
    for (const handler of channelHandlers) {
      const { instance, event, namespace, target } = handler;

      const fullEvent = `http:external:${namespace}:${event}`;

      this.broker.on(fullEvent, async (...args: any[]) => {
        await target.apply(instance, args);
      });

      channels.set(namespace, {
        namespace,
        event,
        fullEvent,
      });
    }
    for (const route of routes) {
      const { method, methodPath, methodType, controllerPath, target } = route;
      const fullPath = this.combinePaths(controllerPath, methodPath);
      this.broker.emit('http:router:register', {
        method,
        path: fullPath,
        action: (ctx) => {
          ctx._state.channel = Array.from(channels.values());
          return target(ctx);
        },
      });
    }
  }

  private combinePaths(basePath: string, methodPath: string): string {
    basePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
    basePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    methodPath = methodPath.startsWith('/') ? methodPath : `/${methodPath}`;
    return `${basePath}${methodPath}`;
  }
}
