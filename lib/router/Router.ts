import { RegexRoute, RouterMetadataKeys } from '../common/constants';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { RouteDefinition } from '../common/interface/router.interface';
import { HttpContext } from '../types';
import Reflector from '../metadata';
export class Router {
  constructor(private apiPrefix: string) {}
  findMatch(method: string, path: string, lang: string): RouteDefinition | null {
    const allRoutes = Reflector.getRoutes();
    const fullPath = `${this.apiPrefix}${path}`;
    return this.findRecursive(allRoutes, method, fullPath, lang);
  }
  private findRecursive(routes: RouteDefinition[], method: string, fullPath: string, lang: string): RouteDefinition | null {
    for (const route of routes) {
      if (method !== route.method) continue;
      const multiLangRoutes = Reflector.get(RouterMetadataKeys.MULTI_LANG, route.constructor);
      if (multiLangRoutes) {
        const langPath = multiLangRoutes[lang];
        route.path = `${this.apiPrefix}${langPath}`;
      }
      const { path: routePath, constructor } = route;
      const paramRegex = routePath.replace(RegexRoute.PARAMETER, '([^/]+)');
      const regex = new RegExp(`^${paramRegex}$`);
      const match = fullPath.match(regex);
      if (match) {
        const paramNames = Array.from(routePath.matchAll(RegexRoute.PARAMETER)).map((m) => m[1]);
        const params = Object.fromEntries(paramNames.map((name, index) => [name, match[index + 1]]));
        route.params = params;
        Reflector.update(constructor, { ...route });
        return { ...route, params };
      }
    }
    return null;
  }
  async run(ctx: HttpContext): Promise<void> {
    const lang = ctx.headers?.['accept-language'] || 'en';
    const match = this.findMatch(ctx.method!, ctx.url!, lang);
    if (!match) {
      return;
    }
    const { action, middlewares, params } = match;
    ctx.params = params || {};
    const middlewareExecutor = new MiddlewareManager();
    middlewareExecutor.use(...middlewares!);
    await middlewareExecutor.run(ctx, action);
  }

  registerController(controller: Function): void {
    const controllerPrefix = Reflector.get(RouterMetadataKeys.CONTROLLER_PREFIX, controller);
    const routes: RouteDefinition[] = Reflector.get(RouterMetadataKeys.ROUTES, controller);
    routes.forEach((route) => {
      route.path = `${this.apiPrefix}${controllerPrefix}${route.path}`;
    });
  }
}
