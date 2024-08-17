import { Parser } from '../../helper/parser';
import Reflect from '../../metadata/metadata';
import { METHODS } from 'http';
import { Context } from '../../types/types';
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

export namespace Router {
  export function findMatch(path: string, method: string, base: string): { controller: any; handlerKey: string; fullRoutePath: string; params: Record<string, string> } | null {
    for (const [routePath, controller] of routes.entries()) {
      if (path.startsWith(routePath)) {
        const routeInstance = new controller();
        const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(routeInstance)).filter((key) => key !== 'constructor');

        for (const key of keys) {
          const handlerMethod = Reflect.get('method', controller.prototype, key);
          const handlerPath = Reflect.get('path', controller.prototype, key);
          let fullRoutePath = handlerPath ? `${routePath}${handlerPath}` : routePath;
          const parsedURL = new Parser.URI(path, base, fullRoutePath);

          if (handlerPath && handlerPath.startsWith('/:')) {
            const paramName = handlerPath.split(':')[1];
            fullRoutePath = `${routePath}/${parsedURL.params[paramName]}`;
          }

          if (handlerMethod === method && fullRoutePath === path) {
            return { controller, handlerKey: key, fullRoutePath, params: parsedURL.params };
          }
        }
      }
    }
    return null;
  }
  export async function run(ctx: Context, routeInstance: any, method: string, handlerKey: string): Promise<void> {
    const handler = routeInstance[handlerKey].bind(routeInstance);
    const mid = Reflect.get('middlewares', routeInstance, handlerKey) || [];
    const classMids = Reflect.get('classMiddlewares', routeInstance) || [];
    // Parse JSON body if the method is POST, PUT, or PATCHif (['POST', 'PUT', 'PATCH'].includes(method)) {
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      ctx.body = await ctx.json();
    }

    // Execute middlewares with early exit on failurefor (const middleware of [...classMiddlewares, ...middlewares]) {
    for (const middleware of [...classMids, ...mid]) {
      const result = await Promise.resolve(middleware(ctx));
      if (result === false) {
        return;
      }
    }
    await handler(ctx);
    console.log('Response should be sent now.');
  }
}
