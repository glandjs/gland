import { HttpEventCore } from '../adapter';
import { AnyMiddleware, ExpressLikeMiddleware, GlandMiddleware } from '../types';
import { MiddlewareConfiguration, RouteInfo } from './manager';
import { MiddlewareAdapter } from './adapter';
import { MiddlewareResolver } from './resolver';

enum MiddlewareEvent {
  REGISTER = 'register',
  GLOBAL = 'global',
  RESOLVE = 'resolve',
  EXECUTE = 'execute',
  FOR_ROUTE = 'route-specific',
  MOUNT = 'mount',
  APPLY_GLOBAL = 'apply-global',
  USE = 'use',
}

export class MiddlewareChannel {
  private middlewareAdapter: MiddlewareAdapter;

  constructor(private channel: HttpEventCore) {
    this.middlewareAdapter = new MiddlewareAdapter(this);
  }

  onRegister(handler: (config: MiddlewareConfiguration) => void) {
    this.channel.on(MiddlewareEvent.REGISTER, handler);
  }

  onGlobal(handler: (middleware: GlandMiddleware) => void) {
    this.channel.on(MiddlewareEvent.GLOBAL, handler);
  }

  onRouteSpecific(handler: (config: { routes: RouteInfo[]; middleware: GlandMiddleware[] }) => void) {
    this.channel.on(MiddlewareEvent.FOR_ROUTE, handler);
  }

  onMount(handler: (config: MiddlewareConfiguration) => void) {
    this.channel.on(MiddlewareEvent.MOUNT, handler);
  }

  onResolve(handler: (ctx: { path: string; method?: string }) => GlandMiddleware[]) {
    this.channel.responed(MiddlewareEvent.RESOLVE, handler);
  }

  onExecute(handler: (ctx: { path: string; method?: string }) => void) {
    this.channel.on(MiddlewareEvent.EXECUTE, handler);
  }

  use(...args: [GlandMiddleware] | [ExpressLikeMiddleware] | [string, AnyMiddleware]): void {
    return this.middlewareAdapter.use(...args);
  }

  register(config: MiddlewareConfiguration) {
    this.channel.emit(MiddlewareEvent.REGISTER, config);
  }

  applyGlobal(middleware: GlandMiddleware) {
    this.channel.emit(MiddlewareEvent.GLOBAL, middleware);
  }

  applyToRoutes(routes: RouteInfo[], middleware: GlandMiddleware[]) {
    this.channel.emit(MiddlewareEvent.FOR_ROUTE, { routes, middleware });
  }

  mount(config: MiddlewareConfiguration) {
    this.channel.emit(MiddlewareEvent.MOUNT, config);
  }

  resolve(ctx: { path: string; method?: string }): GlandMiddleware[] {
    return this.channel.request(MiddlewareEvent.RESOLVE, ctx);
  }

  createResolver(): MiddlewareResolver {
    return this.channel.request(MiddlewareEvent.EXECUTE, null);
  }
}
