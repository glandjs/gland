import { GlandMiddleware } from '../interface';
import { MiddlewareConfiguration, RouteInfo } from './manager';
import { MiddlewareChannel } from './channel';
import { RouteMatcher } from './route-matcher';

export class MiddlewareContainer {
  private global: { [key: string]: GlandMiddleware[] } = Object.create(null);
  private middlewares: { [key: string]: MiddlewareConfiguration[] } = Object.create(null);

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
    const existingMiddlewares = this.global[key] || [];
    this.global[key] = [...existingMiddlewares, middleware];
  }

  addMiddleware(middleware: GlandMiddleware[], routes: RouteInfo[], excluded?: RouteInfo[]): void {
    const config: MiddlewareConfiguration = {
      middleware,
      routes,
      ...excluded,
    };
    config.routes.forEach((route) => {
      const key = route.path;
      const existingConfigs = this.middlewares[key] || [];
      existingConfigs.push(config);
      this.middlewares[key] = existingConfigs;
    });
  }

  resolveMiddlewares(path: string, method?: string): GlandMiddleware[] {
    const globalMidds = Object.values(this.global).flat();

    const routeMidds: GlandMiddleware[] = [];

    Object.values(this.middlewares).forEach((configs) => {
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
