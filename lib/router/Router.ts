import { RouterUtils, RouterMetadataKeys } from '../common/constants';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { RouteDefinition } from '../common/interface/router.interface';
import { HttpContext } from '../types';
import Reflector from '../metadata';
import { URL } from 'url';
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
      const match = fullPath.split('?')[0].match(regex);
      if (match) {
        // Extract query parameters
        const urlParts = fullPath.split('?');
        let queryParams: Record<string, string | number | undefined> = {};

        if (urlParts.length > 1) {
          // Only analyze the query part if it exists
          const query = new URLSearchParams(urlParts[1]);
          queryParams = Object.fromEntries(query.entries());
        }

        // Extract route parameters (e.g., from /users/:id)
        const paramNames = Array.from(routePath.matchAll(RouterUtils.PARAMETER)).map((m) => m[1]);
        const params = Object.fromEntries(paramNames.map((name, index) => [name, match[index + 1]]));

        // Update route with matched params and query
        route.params = params;
        route.query = queryParams;
        Reflector.update(constructor, { ...route });
        console.log('ROUTE:', route);

        return { ...route };
      }
    }
    return null;
  }
  async run(ctx: HttpContext): Promise<void> {
    const lang = this.extractLang(ctx.req.headers?.['accept-language']);
    const route = this.findMatch(ctx.req.method!, ctx.req.url!, lang);
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
      // Fetch guards from metadata
      const guards = Reflector.get(RouterMetadataKeys.GUARDS, constructor, action.name);

      if (guards) {
        for (const guard of guards) {
          await guard(ctx);
          if (ctx.res.writableEnded) return;
        }
      }
      if (transformFn) {
        transformFn(ctx); // Execute transform function
        if (ctx.res.writableEnded) return;
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
