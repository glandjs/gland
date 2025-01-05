import { DECORATOR_ROUTES_KEY } from '../../common/constants';
import { RequestMethod } from '../../common/enums/method.enum';
import Reflector from '../../metadata';
import { MiddlewareFn } from '../../middleware/Middleware.interface';
import { RouteMetadata } from './decorator.interface';
function createDecorator(method: RequestMethod) {
  return (path: string, middlewares?: MiddlewareFn[]): MethodDecorator => {
    return (target, propertyKey, descriptor) => {
      if (!descriptor || typeof descriptor.value !== 'function') {
        throw new Error(`@${method} decorator must be applied to a method.`);
      }
      const existingRoutes: RouteMetadata[] = Reflector.get(DECORATOR_ROUTES_KEY, target.constructor) || [];
      existingRoutes.push({
        method,
        path,
        handler: propertyKey as string,
        middlewares: middlewares || [],
      });
      Reflector.define(DECORATOR_ROUTES_KEY, existingRoutes, target.constructor);
    };
  };
}
export function createMethodDecorators() {
  return Object.values(RequestMethod).map((method: RequestMethod) => {
    return createDecorator(method);
  });
}
export const [Get, Post, Put, Delete, Patch, Options, Head, Search] = createMethodDecorators();
