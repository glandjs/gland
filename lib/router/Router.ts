import { RouterUtils, RouterMetadataKeys } from '../common/constants';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { RouteDefinition } from '../common/interface/router.interface';
import { HttpContext } from '../types';
import Reflector from '../metadata';
export class Router {
  constructor(private apiPrefix: string) {}
  // Utility function to extract the primary language code from the accept-language header
  private extractLang(header: string | undefined): string {
    if (!header) return RouterUtils.DEFAULT_LANG;

    // Extract primary language code (e.g., "en" from "en-US,en;q=0.9")
    const langMatch = header.split(',')[0].split('-')[0];
    return langMatch || RouterUtils.DEFAULT_LANG;
  }
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
      const paramRegex = routePath.replace(RouterUtils.PARAMETER, '([^/]+)');
      const regex = new RegExp(`^${paramRegex}$`);
      const match = fullPath.match(regex);
      if (match) {
        const paramNames = Array.from(routePath.matchAll(RouterUtils.PARAMETER)).map((m) => m[1]);
        const params = Object.fromEntries(paramNames.map((name, index) => [name, match[index + 1]]));
        route.params = params;
        Reflector.update(constructor, { ...route });
        return { ...route, params };
      }
    }
    return null;
  }
  async run(ctx: HttpContext): Promise<void> {
    const lang = this.extractLang(ctx.headers?.['accept-language']);
    const route = this.findMatch(ctx.method!, ctx.url!, lang);
    if (!route) {
      return;
    }
    const { action, middlewares, params, constructor } = route;
    ctx.params = params || {};
    const middlewareExecutor = new MiddlewareManager();
    middlewareExecutor.use(...middlewares!);

    // Wrap the controller action with the transform function
    const transformFn = Reflector.get(RouterMetadataKeys.TRANSFORM, constructor, action.name);
    const wrappedAction = async (ctx: HttpContext) => {
      if (transformFn) {
        transformFn(ctx); // Execute transform function
      }
      await action(ctx); // Execute the controller action
    };

    // Run middleware and then the wrapped action
    await middlewareExecutor.run(ctx, wrappedAction);
  }

  registerController(controller: Function): void {
    const controllerPrefix = Reflector.get(RouterMetadataKeys.CONTROLLER_PREFIX, controller);
    const routes: RouteDefinition[] = Reflector.get(RouterMetadataKeys.ROUTES, controller);
    routes.forEach((route) => {
      route.path = `${this.apiPrefix}${controllerPrefix}${route.path}`;
    });
  }
}
