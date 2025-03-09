import { GlandMiddleware } from '../interface';
import { MiddlewareConfiguration, RouteInfo } from './manager';
import { MiddlewareChannel } from './channel';
import { RouteMatcher } from './route-matcher';

export class MiddlewareContainer {
  private global = new Map<string, GlandMiddleware[]>();
  private middlewares = new Map<string, MiddlewareConfiguration[]>();

  constructor(private _channel: MiddlewareChannel) {
    this.setupEventHandlers();
  }
  private setupEventHandlers() {
    this._channel.onGlobal((middleware) => {
      this.addGlobal(middleware);
    });

    this._channel.onRegister(({ middleware, routes, excludedRoutes }) => {
      this.addMiddleware(middleware, routes, excludedRoutes);
    });

    this._channel.onResolve(({ path, method }) => {
      return this.resolveMiddlewares(path, method);
    });
  }

  addGlobal(middleware: GlandMiddleware): void {
    const key = '*';
    const existingMiddlewares = this.global.get(key) || [];
    this.global.set(key, [...existingMiddlewares, middleware]);
  }

  addMiddleware(middleware: GlandMiddleware[], routes: RouteInfo[], excluded?: RouteInfo[]): void {
    const config: MiddlewareConfiguration = {
      middleware,
      routes,
      ...excluded,
    };
    config.routes.forEach((route) => {
      const key = route.path;
      const existingConfigs = this.middlewares.get(key) || [];
      existingConfigs.push(config);
      this.middlewares.set(key, existingConfigs);
    });
  }

  resolveMiddlewares(path: string, method?: string): GlandMiddleware[] {
    const globalMidds = Array.from(this.global.values()).flat();

    const routeMidds: GlandMiddleware[] = [];

    this.middlewares.forEach((configs) => {
      configs.forEach((config) => {
        const isMatch = config.routes.some((route) => RouteMatcher.match(path, route, method));

        const isExcluded = RouteMatcher.exclude(path, config.excludedRoutes, method);

        if (isMatch && !isExcluded) {
          routeMidds.push(...config.middleware);
        }
      });
    });

    return [...globalMidds, ...routeMidds];
  }
}
