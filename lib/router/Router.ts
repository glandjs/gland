import { EventSystem } from '../events';
import { MiddlewarePipeline } from '../middleware';
import { Context } from '@medishn/gland/common/interfaces';
import { RouteMatcher } from './RouteMatcher';
import { RequestHandler } from './RequestHandler';
export class Router {
  private routeMatcher: RouteMatcher;
  private requestHandler: RequestHandler;
  constructor(apiPrefix: string, private events: EventSystem, middlewarePipeline: MiddlewarePipeline) {
    this.routeMatcher = new RouteMatcher(apiPrefix);
    this.requestHandler = new RequestHandler(this.routeMatcher, this.events, middlewarePipeline);
  }
  async run(ctx: Context): Promise<void> {
    await this.requestHandler.handleRequest(ctx);
    return;
  }
}
