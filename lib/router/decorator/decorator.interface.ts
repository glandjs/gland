import { MiddlewareFn } from '../../middleware/Middleware.interface';

export interface RouteMetadata {
  method: string;
  path: string;
  handler: string;
  middlewares?: MiddlewareFn[];
}
