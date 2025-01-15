import { RequestMethod, RouterMetadataKeys } from '../common/enums';
import { RouteDefinition } from '../common/interfaces';
import { MiddlewareFn } from '../common/types';
import Reflector from '../metadata';
function createDecorator(method: RequestMethod) {
  return (path: string, middlewares?: MiddlewareFn[]): MethodDecorator => {
    return (target, __, descriptor) => {
      if (!descriptor || typeof descriptor.value !== 'function') {
        throw new Error(`@${method} decorator must be applied to a method.`);
      }
      const controllerPrefix = Reflector.get(RouterMetadataKeys.CONTROLLER_PREFIX, target.constructor);
      let fullPath = path;
      if (controllerPrefix) {
        fullPath = `${controllerPrefix}${path}`.replace(/\/+$/, '');
      }
      const existingRoutes: RouteDefinition[] = Reflector.get(RouterMetadataKeys.ROUTES, target.constructor) ?? [];
      existingRoutes.push({
        method,
        path: fullPath,
        constructor: target.constructor,
        action: descriptor.value,
        middlewares: middlewares ?? [],
        params: {},
        query: {},
      });
      Reflector.define(RouterMetadataKeys.ROUTES, existingRoutes, target.constructor);
    };
  };
}
export function createMethodDecorators() {
  return Object.values(RequestMethod).map((method: RequestMethod) => {
    return createDecorator(method);
  });
}
export const [Get, Post, Put, Delete, Patch, Options, Head, Search] = createMethodDecorators();
