import { Parser } from '../../helper/parser';
import Reflect from '../../metadata';
import { METHODS } from 'http';
import { Context, RouteHandler } from '../../types';
import { Gland } from '../../types/gland';
import { Gmid } from '../middleware';
export const routes: Map<string, RouteHandler> = new Map();
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
  export function set(controllerClassOrFunction: RouteHandler, routePath?: string): void {
    if (typeof controllerClassOrFunction === 'function') {
      if (routePath) {
        Reflect.init('route', routePath, controllerClassOrFunction.prototype);
        routes.set(routePath, controllerClassOrFunction);
      } else {
        // Handle the case where the routePath isn't directly provided
        const existingRoutePath = Reflect.get('route', controllerClassOrFunction.prototype);
        if (existingRoutePath) {
          routes.set(existingRoutePath, controllerClassOrFunction);
        }
      }
    }
  }
  function isClass(func: Function): boolean {
    return typeof func === 'function' && /^class\s/.test(Function.prototype.toString.call(func));
  }
  export function findMatch(path: string, method: string, base: string): { controller: any; handlerKey: string; fullRoutePath: string; params: Record<string, string> } | null {
    for (const [routePath, controller] of routes.entries()) {
      if (path.startsWith(routePath)) {
        if (isClass(controller)) {
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
        } else if (typeof controller === 'function') {
          const parsedURL = new Parser.URI(path, base, routePath);
          return {
            controller,
            handlerKey: '',
            fullRoutePath: routePath,
            params: parsedURL.params,
          };
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
    // Parse JSON body if the method is POST, PUT, or PATCH
    if (['POST', 'PUT', 'PATCH'].includes(ctx.method!)) {
      ctx.body = await ctx.json();
    }
    // Execute global middlewares first
    await execute(ctx, GlMid);
    // Execute class and method middlewares with the handler
    await execute(ctx, allMids, handler);
  }
  export async function execute(ctx: Context, middlewares: Function[], finalHandler: Function | null = null) {
    let index = -1;
    const next = async () => {
      index++;
      if (index < middlewares.length) {
        const current = middlewares[index];
        if (current.length === 3) {
          await new Promise<void>((resolve, reject) => {
            (current as any)(ctx.rq, ctx.rs, (err: any) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } else if (current.length === 2) {
          // Execute Gland.Middleware (ctx, next)
          await current(ctx, next);
        } else if (current.length === 1) {
          // Execute handler with a single argument (ctx)
          await current(ctx);
        }
      } else if (finalHandler) {
        if (finalHandler.length === 3) {
          // If finalHandler expects (req, res, next), convert it to Gland.Middleware
          await new Promise<void>((resolve, reject) => {
            (finalHandler as any)(ctx.req, ctx.res, (err: any) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } else if (finalHandler.length === 2) {
          // Execute Gland.Middleware (ctx, next)
          await finalHandler(ctx, next);
        } else if (finalHandler.length === 1) {
          // Execute handler with a single argument (ctx)
          await finalHandler(ctx);
        }
      }
    };

    await next();
  }
  export function init(exposedClasses: any[]) {
    for (const controllerClass of exposedClasses) {
      set(controllerClass);
    }
  }
}
