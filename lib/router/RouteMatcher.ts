import { normalizePath, RouterUtils } from '@medishn/gland/utils';
import Reflector from '../metadata';
import { Context, RouteDefinition } from '@medishn/gland/common/interfaces';
import { RouterMetadataKeys } from '@medishn/gland/common/enums';

export class RouteMatcher {
  constructor(private apiPrefix: string) {}
  matchRoute(ctx: Context, routes: RouteDefinition[]): RouteDefinition | null {
    const fullPath = normalizePath(`${this.apiPrefix}${ctx.req.url}`);
    return this.matchRouteRecursive(ctx, routes, fullPath);
  }
  private matchRouteRecursive(ctx: Context, routes: RouteDefinition[], fullPath: string): RouteDefinition | null {
    const method = ctx.req.method!;
    for (const route of routes) {
      if (method !== route.method) continue;

      const langPath = this.getMultilingualPath(ctx, route);
      if (langPath) route.path = langPath;

      const regex = this.createPathRegex(route.path);
      const match = regex.exec(fullPath.split('?')[0]);

      if (match) {
        const params = this.extractParams(route.path, match);
        const queryParams = this.extractQueryParams(fullPath);
        route.params = params;
        route.query = queryParams;

        return { ...route };
      }
    }
    return null;
  }
  private getMultilingualPath(ctx: Context, route: RouteDefinition): string | null {
    const multiLangRoutes = Reflector.get(RouterMetadataKeys.MULTI_LANGUAGE, route.constructor);
    if (!multiLangRoutes) return null;

    const lang = ctx.language;
    return (multiLangRoutes[lang] ?? multiLangRoutes.default) || null;
  }

  private createPathRegex(routePath: string): RegExp {
    const normalizedPath = normalizePath(routePath);
    const paramRegex = normalizedPath.replace(RouterUtils.PARAMETER, '([^/]+)');
    return new RegExp(`^${paramRegex}$`);
  }

  private extractParams(routePath: string, match: RegExpExecArray): Record<string, string> {
    const paramNames = Array.from(routePath.matchAll(RouterUtils.PARAMETER)).map((m) => m[1]);
    return Object.fromEntries(paramNames.map((name, index) => [name, match[index + 1]]));
  }

  private extractQueryParams(fullPath: string): Record<string, string | number | undefined> {
    const query = fullPath.split('?')[1];
    return query ? Object.fromEntries(new URLSearchParams(query).entries()) : {};
  }
}
