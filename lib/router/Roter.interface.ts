import { MiddlewareFn } from '../middleware/Middleware.interface';

export interface RouteDefinition {
  handler: Function;
  middlewares: MiddlewareFn[];
}
