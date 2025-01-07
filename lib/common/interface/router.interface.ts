import { MiddlewareFn } from './middleware.interface';

export interface RouteDefinition {
  method: string;
  path: string;
  handler: Function;
  middlewares?: MiddlewareFn[];
  params: { [key: string]: string };
}
