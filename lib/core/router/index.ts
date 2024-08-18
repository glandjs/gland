import { Parser } from '../../helper/parser';
import Reflect from '../../metadata/metadata';
import { METHODS } from 'http';
import { Context, RouteHandler } from '../../types/types';
import { Gland } from '../../types/gland';
import { Gmid } from '../middleware';
export const routes: Map<string, RouteHandler> = new Map();

export function Route(path: string): ClassDecorator {
  return (target: Function): void => {
    Reflect.init('route', path, target.prototype);
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
  export async function run(ctx: Context, routeInstance: any, method: string, handlerKey: string, GlMid: Gland.Middleware[]): Promise<void> {
    const handler = routeInstance[handlerKey].bind(routeInstance);
    const methodMids = Reflect.get('middlewares', routeInstance.constructor.prototype, handlerKey) || [];
    const classMids = Reflect.get('classMiddlewares', routeInstance.constructor.prototype) || [];
    const globalMids = Gmid.get();

    const allMids = [...globalMids, ...classMids, ...methodMids];
    // Parse JSON body if the method is POST, PUT, or PATCHif (['POST', 'PUT', 'PATCH'].includes(method)) {
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      ctx.body = await ctx.json();
    }
    // Execute global middlewares first
    await execute(ctx, GlMid);
    // Execute class and method middlewares with the handler
    await execute(ctx, allMids, handler);
  }
  async function execute(ctx: Context, middlewares: Function[], finalHandler: Function | null = null) {
    let index = -1;

    const next = async () => {
      index++;
      if (index < middlewares.length) {
        await middlewares[index](ctx, next);
      } else if (finalHandler) {
        await finalHandler(ctx);
      }
    };

    await next();
  }
  export function init(exposedClasses: any[]) {
    for (const controllerClass of exposedClasses) {
      const routePath = Reflect.get('route', controllerClass.prototype);
      if (routePath) {
        routes.set(routePath, controllerClass);
      }
    }
  }
}
