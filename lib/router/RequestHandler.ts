import { EventSystem } from '../events';
import { RouteMatcher } from './RouteMatcher';
import { MiddlewarePipeline } from '../middleware';
import { Context } from '@medishn/gland/common/interfaces';
import { CoreEventType, RouterMetadataKeys } from '@medishn/gland/common/enums';
import Reflector from '../metadata';
import { ActionHandler, RequestInfo } from '@medishn/gland/utils';
import { ContextFactory } from '../context';

export class RequestHandler {
  constructor(private routeMatcher: RouteMatcher, private events: EventSystem, private middlewareExecutor: MiddlewarePipeline) {}

  async handleRequest(ctx: Context): Promise<void> {
    const routes = Reflector.getRoutes();
    const route = this.routeMatcher.matchRoute(ctx, routes);

    if (!route) {
      return;
    }

    const { middlewares, params, query, constructor } = route;
    const controllerMiddlewares = Reflector.get(RouterMetadataKeys.MIDDLEWARES, constructor) || [];

    ctx.params = params || {};
    ctx.query = query || {};
    const requestInfo = new RequestInfo(ctx);

    const routeContext = ContextFactory.createRouteContext(ctx, route, requestInfo);
    await this.events.emit(CoreEventType.Route, routeContext);

    this.middlewareExecutor.add(...middlewares!, ...controllerMiddlewares);
    await this.middlewareExecutor.execute(ctx, async () => {
      await ActionHandler.wrappedAction({ ctx, route, requestInfo });
    });

    if (ctx.res.writableEnded) return;
  }
}
