import { RouterUtils, RouterMetadataKeys } from '../common/constants';
import { MiddlewareManager } from '../middleware/MiddlewareManager';
import { RouteDefinition } from '../common/interface/router.interface';
import Reflector from '../metadata';
import { EventSystemManager } from '../events/EventSystemManager';
import { ServerRequest } from '../types';
import { ContextHandler, CoreEventType } from '../events/EventSystem.interface';
import { RequestInfo } from '../utils/RequestInfo';
import { handleETag } from '../utils';
import { HttpStatus } from '../common/enums/status.enum';
export class Router {
  constructor(private apiPrefix: string, private events: EventSystemManager) {}
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
        return { ...route };
      }
    }
    return null;
  }
  async run(ctx: ServerRequest): Promise<void> {
    const lang = this.extractLang(ctx.req.headers?.['accept-language']);
    const route = this.findMatch(ctx.req.method!, ctx.req.url!, lang);
    const requestInfo = new RequestInfo(ctx);
    if (!route) {
      return;
    }
    const { action, middlewares, params, constructor, query } = route;
    ctx.params = params || {};
    ctx.clientIp = requestInfo.ip;
    ctx.query = query || {};
    let dynamicContext: ContextHandler['RouteContext'] = {
      path: route.path,
      method: route.method,
      params: params,
      query,
      middlewares,
      statusCode: ctx.res.statusCode,
      headers: ctx.req.headers,
      ip: requestInfo.ip,
      statusMessage: 'OK',
      statusCodeClass: requestInfo.statusCodeClass,
      isCacheHit: false,
      response: {
        contentLength: requestInfo.bodySize,
        contentType: ctx.req.headers['content-type'],
      },
      request: {
        body: ctx.body,
        url: ctx.req.url,
        cookies: requestInfo.cookies,
        protocol: requestInfo.protocol,
        userAgent: requestInfo.userAgent,
        referer: requestInfo.referer,
        acceptedLanguages: requestInfo.acceptedLanguages,
        bodySize: +requestInfo.bodySize,
        bodyRaw: requestInfo.bodyRaw,
      },
    };
    await handleETag(ctx);
    // Example: Check if ETag resulted in a 304 (Not Modified)
    if (ctx.res.statusCode === 304) {
      dynamicContext.statusMessage = 'NOT_MODIFIED';
      dynamicContext.statusCodeClass = '3xx'; // 3xx indicates redirect or not modified
    }

    // Example: If there is an error, update the statusCode and statusMessage
    if (ctx.error) {
      dynamicContext.statusCode = 500;
      dynamicContext.statusMessage = 'INTERNAL_SERVER_ERROR';
      dynamicContext.statusCodeClass = '5xx';
    }
    this.events.emit(CoreEventType.Route, dynamicContext);
    const middlewareExecutor = new MiddlewareManager();
    middlewareExecutor.use(...middlewares!);
    // Wrap the controller action with the transform function
    const transformFn = Reflector.get(RouterMetadataKeys.TRANSFORM, constructor, action.name);
    const wrappedAction = async (ctx: ServerRequest) => {
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
