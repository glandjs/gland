import { RegexRoute, RouterMetadataKeys } from '../common/constants';
import { HttpContext } from 'node:http';
import Reflector from '../metadata';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { RouteDefinition } from '../common/interface/router.interface';
export class Router {
  constructor(private apiPrefix: string) {}
  findMatch(method: string, path: string): RouteDefinition | null {
    const allRoutes = Reflector.getRoutes();
    const fullPath = `${this.apiPrefix}${path}`;
    return this.findRecursive(allRoutes, method, fullPath);
  }
  private findRecursive(routes: RouteDefinition[], method: string, fullPath: string): RouteDefinition | null {
    for (const route of routes) {
      const { method: routeMethod, path: routePath, constructor } = route;
      if (method !== routeMethod) continue;

      const paramRegex = routePath.replace(RegexRoute.PARAMETER, '([^/]+)');
      const regex = new RegExp(`^${paramRegex}$`);
      const match = fullPath.match(regex);
      if (match) {
        const paramNames = Array.from(routePath.matchAll(RegexRoute.PARAMETER)).map((m) => m[1]);
        const params = Object.fromEntries(paramNames.map((name, index) => [name, match[index + 1]]));
        Reflector.update(constructor, { ...route, params });
        return { ...route, params };
      }
    }
    return null;
  }
  run(ctx: HttpContext): void {
    const match = this.findMatch(ctx.method!, ctx.url!);
    if (!match) {
      return;
    }
    const { action, middlewares, params } = match;
    ctx.params = params || {};
    const middlewareExecutor = new MiddlewareManager();
    middlewareExecutor.use(...middlewares!);
    middlewareExecutor.run(ctx, action);
  }

  registerController(controller: Function): void {
    const controllerPrefix = Reflector.get(RouterMetadataKeys.CONTROLLER_PREFIX, controller);
    const routes: RouteDefinition[] = Reflector.get(RouterMetadataKeys.ROUTES, controller);
    routes.forEach((route) => {
      route.path = `${this.apiPrefix}${controllerPrefix}${route.path}`;
    });
  }
}
