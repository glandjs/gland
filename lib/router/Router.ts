import { __BASE_PATH__, DECORATOR_ROUTES_KEY, ROUTE_KEY_GENERATOR, ROUTER_PREFIX_KEY } from '../common/constants';
import { AppSettings } from '../core/AppSettings';
import { HttpContext } from 'node:http';
import { Middleware } from '../middleware/Middleware';
import { RouteDefinition } from './Roter.interface';
import { MiddlewareFn } from '../middleware/Middleware.interface';
import { RouteMetadata } from './decorator/decorator.interface';
import Reflector from '../metadata';
export class Router extends AppSettings {
  constructor(private basePath: string = __BASE_PATH__) {
    super();
  }
  private createRoute(method: string, path: string, handler: Function, middlewares: MiddlewareFn[] = []): void {
    const routeKey = `${method.toUpperCase()}:${this.basePath}${path}`;
    this._routes.set(routeKey, { handler, middlewares });
  }

  set(method: string, path: string, handler: Function, middlewares: MiddlewareFn[] = []): void {
    this.createRoute(method, path, handler, middlewares);
  }

  findMatch(method: string, path: string): RouteDefinition | null {
    const routeKey = ROUTE_KEY_GENERATOR(method, `${this.basePath}${path}`);
    const exactMatch = this._routes.get(routeKey);
    if (exactMatch) return exactMatch as RouteDefinition;

    const dynamicMatchKey = Array.from(this._routes.keys()).find((key) => new RegExp(key.replace(/:([a-zA-Z]+)/g, '[^/]+')).test(routeKey));

    return dynamicMatchKey ? (this._routes.get(dynamicMatchKey) as RouteDefinition) : null;
  }
  run(ctx: HttpContext): void {
    const match = this.findMatch(ctx.method!, ctx.url!);
    if (!match) {
      return;
    }
    const { handler, middlewares } = match;
    const middlewareExecutor = new Middleware();
    middlewareExecutor.new(...middlewares);
    middlewareExecutor.execute(ctx, handler);
  }

  initializeRoutes(routes: Array<{ method: string; path: string; handler: Function; middlewares?: MiddlewareFn[] }>): void {
    routes.forEach(({ method, path, handler, middlewares }) => {
      this.set(method, path, handler, middlewares);
    });
  }
  registerControllers(controllers: Function[]): void {
    controllers.forEach((controller) => {
      const prefix = Reflector.get(ROUTER_PREFIX_KEY, controller);
      const routes: RouteMetadata[] = Reflector.get(DECORATOR_ROUTES_KEY, controller) || [];
      routes.forEach(({ method, path, handler, middlewares }) => {
        const routeKey = ROUTE_KEY_GENERATOR(method, `${prefix}${path}`);
        const instance = new (controller as any)();
        const handlerFn = instance[handler].bind(instance);
        this._routes.set(routeKey, {
          handler: handlerFn,
          middlewares: middlewares || [],
        });
      });
    });
  }
}
