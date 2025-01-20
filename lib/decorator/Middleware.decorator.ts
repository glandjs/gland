import { RouterMetadataKeys } from '../common/enums';
import { MiddlewareFn } from '../common/types';
import Reflector from '../metadata';

export function Middleware(...middlewares: MiddlewareFn[]): ClassDecorator {
  return (target) => {
    const existingMiddlewares: MiddlewareFn[] = Reflector.get(RouterMetadataKeys.MIDDLEWARES, target) || [];
    const updatedMiddlewares = [...existingMiddlewares, ...middlewares];
    Reflector.define(RouterMetadataKeys.MIDDLEWARES, updatedMiddlewares, target);
  };
}
