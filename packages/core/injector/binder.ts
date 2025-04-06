import type { Broker } from '@glandjs/events';
import type { Explorer } from './explorer';
export interface RouteRegister {
  route: string;
  controller: {
    path: string;
    methodName: string;
  };
  method: string;
  action: Function;
}
export class AppBinder {
  constructor(
    private explorer: Explorer,
    private broker: Broker,
  ) {}
  bind(): void {
    this.bindControllers();
  }

  public bindControllers(): void {
    const controllers = this.explorer.exploreControllers();
    const channels = this.explorer.exploreChannels();
    const map = new Map<
      string,
      {
        namespace: string;
        event: string;
        fullEvent: string;
      }
    >();
    for (const channel of channels) {
      const { instance, event, namespace, target } = channel;

      const fullEvent = `gland:external:${namespace}:${event}`;

      this.broker.on(fullEvent, async (...args: any[]) => {
        await target.apply(instance, args);
      });

      map.set(namespace, {
        namespace,
        event,
        fullEvent,
      });
    }
    for (const controller of controllers) {
      const { method, route, controller: ctr } = controller;
      const fullPath = this.combinePaths(ctr.path, route);
      this.broker.emit('gland:router:register', {
        route: route,
        controller: {
          path: fullPath,
          methodName: ctr.methodName,
        },
        method,
        action: (ctx) => {
          ctx._state.channel = Array.from(map.values());
          return ctr.target(ctx);
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
