import { RequestMethod } from '../../common/enums/method.enum';
import Reflector from '../../metadata';
import { MiddlewareFn } from '../../common/interface/middleware.interface';
import { RouterMetadataKeys } from '../../common/constants';
import { RouteDefinition } from '../../common/interface/router.interface';
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
      const existingRoutes: RouteDefinition[] = Reflector.get(RouterMetadataKeys.ROUTES, target.constructor) || [];
      existingRoutes.push({
        method,
        path: fullPath,
        constructor: target.constructor,
        action: descriptor.value,
        middlewares: middlewares || [],
        params: {},
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
