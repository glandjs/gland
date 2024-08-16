import Reflect from '../../metadata/metadata';
import { METHODS } from 'http';
type RouteHandler = new (...args: any[]) => any;
export const routes: Map<string, RouteHandler> = new Map();

export function Route(path: string): ClassDecorator {
  return (target: Function): void => {
    routes.set(path, target as RouteHandler);
  };
}

const methods = METHODS.reduce((acc: Record<string, Function>, method: string) => {
  const decoratorName = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  acc[decoratorName] = generator(method);
  return acc;
}, {});
function generator(method: string) {
  return (path: string): MethodDecorator => {
    return (target: Object, propertyKey: string | symbol): void => {
      Reflect.init('method', method, target, propertyKey);
      Reflect.init('path', path, target, propertyKey);
    };
  };
}
export const { Get, Post, Put, Delete, Patch, Options, Head } = methods;
