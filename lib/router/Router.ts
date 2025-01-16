import Reflector from '../metadata';
import { EventSystem } from '../events';
import { MiddlewareStack } from '../middleware';
import { ActionHandler, RequestInfo, RouterUtils } from '../utils';
import { ContextFactory } from '../context';
import { RouteDefinition, ServerRequest } from '../common/interfaces';
import { CoreEventType, HttpStatus, RouterMetadataKeys } from '../common/enums';
export class Router {
  constructor(private apiPrefix: string, private events: EventSystem) {}
  findMatch(ctx: ServerRequest): RouteDefinition | null {
    const allRoutes = Reflector.getRoutes();
    const fullPath = `${this.apiPrefix}${ctx.req.url}`;

    return this.findRecursive(ctx, allRoutes, fullPath);
  }
  private findRecursive(ctx: ServerRequest, routes: RouteDefinition[], fullPath: string): RouteDefinition | null {
    const method = ctx.req.method!;
    for (const route of routes) {
      if (method !== route.method) continue;
      const multiLangRoutes = Reflector.get(RouterMetadataKeys.MULTI_LANG, route.constructor);
      if (multiLangRoutes) {
        const lang = ctx.language;
        let langPath = multiLangRoutes[lang];
        if (!langPath) {
          langPath = multiLangRoutes.default;
        }
        if (!langPath) continue;
        route.path = `${this.apiPrefix}${langPath}`;
      }
      const { path: routePath, constructor } = route;
      const paramRegex = routePath.replace(RouterUtils.PARAMETER, '([^/]+)');
      const regex = new RegExp(`^${paramRegex}$`);
      const pathWithoutQuery = fullPath.split('?')[0];
      const match = regex.exec(pathWithoutQuery);
      if (match) {
        const urlParts = fullPath.split('?');
        let queryParams: Record<string, string | number | undefined> = {};

        if (urlParts.length > 1) {
          const query = new URLSearchParams(urlParts[1]);
          queryParams = Object.fromEntries(query.entries());
        }

        const paramNames = Array.from(routePath.matchAll(RouterUtils.PARAMETER)).map((m) => m[1]);
        const params = Object.fromEntries(paramNames.map((name, index) => [name, match[index + 1]]));

        route.params = params;
        route.query = queryParams;
        Reflector.update(constructor, { ...route });
        return { ...route };
      }
    }
    return null;
  }
  async run(ctx: ServerRequest): Promise<void> {
    const route = this.findMatch(ctx);
    const requestInfo = new RequestInfo(ctx);
    if (!route) {
      return;
    }
    const { middlewares, params, query } = route;
    ctx.params = params ?? {};
    ctx.clientIp = requestInfo.ip;
    ctx.query = query ?? {};
    let routeContext = ContextFactory.createRouteContext(ctx, route, requestInfo);
    if (ctx.res.statusCode === 304) {
      routeContext.statusMessage = 'NOT_MODIFIED';
      routeContext.statusCodeClass = '3xx';
      return ctx.send({
        statusCode: HttpStatus.NOT_MODIFIED,
        message: 'Not Modified',
        data: null,
      });
    }
    if (ctx.error) {
      routeContext.statusCode = 500;
      routeContext.statusMessage = 'INTERNAL_SERVER_ERROR';
      routeContext.statusCodeClass = '5xx';
      return ctx.send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        error: ctx.error,
      });
    }
    await this.events.emit(CoreEventType.Route, routeContext);

    const middlewareExecutor = new MiddlewareStack();
    middlewareExecutor.use(...middlewares!);

    await middlewareExecutor.execute(ctx, async () => {
      await ActionHandler.wrappedAction({ ctx, route, requestInfo });
    });
  }
}
