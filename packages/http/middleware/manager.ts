import { isArray } from '@medishn/toolkit';
import { GlandMiddleware } from '../interface';
import { MiddlewareContainer } from './container';
import { MiddlewareChannel } from './channel';
import { MiddlewareResolver } from './resolver';
export interface RouteInfo {
  path: string;
  method?: string;
}
export interface MiddlewareConfiguration {
  middleware: GlandMiddleware[];
  routes: RouteInfo[];
  excludedRoutes?: RouteInfo[];
}

export class MiddlewareManager {
  constructor(private readonly _channel: MiddlewareChannel) {
    new MiddlewareContainer(this._channel);
    this._channel.onExecute(() => this.createResolver());
    this._channel.onRouteSpecific(() => this.applyToRoutes.bind(this));
    this._channel.onMount(() => this.mount.bind(this));
  }
  private applyToRoutes(routes: RouteInfo | RouteInfo[], ...middleware: GlandMiddleware[]): this {
    const routeList = isArray(routes) ? routes : [routes];
    this._channel.applyToRoutes(routeList, middleware);
    return this;
  }

  private mount(routes: RouteInfo | RouteInfo[], middleware: GlandMiddleware[], excludedRoutes?: RouteInfo[]): this {
    const routeList = isArray(routes) ? routes : [routes];
    this._channel.mount({
      middleware,
      routes: routeList,
      excludedRoutes,
    });
    return this;
  }

  private createResolver(): MiddlewareResolver {
    return new MiddlewareResolver(this._channel);
  }
}
