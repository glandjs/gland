import { RequestMethod, RouterMetadataKeys } from '../common/enums';
import { RouteDefinition } from '../common/interfaces';
import { MiddlewareFn } from '../common/types';
import Reflector from '../metadata';
import { RouteNormalizer } from '../utils';
/**
 * @module Route Decorators
 * @description
 * This module provides decorators for HTTP methods (e.g., `@Get`, `@Post`, `@Put`, etc.).
 * These decorators are used to define routes in the application and are mapped to the respective HTTP methods.
 * They allow specifying the path for the route and optional middleware functions for request processing.
 * The decorators also integrate with the `Reflector` to store route metadata that can be used later by the framework.
 *
 * The function `createDecorator` is a generator that creates HTTP method decorators like `@Get`, `@Post`, etc.
 * Each of these decorators can be applied to controller methods to bind routes to HTTP requests.
 *
 * @example
 * // Example of usage for @Get decorator:
 * @Controller('/app')
 * class AppController {
 *   @Get('/hello')
 *   getHello(ctx: ServerRequest) {
 *     ctx.send('Hello World!');
 *   }
 * }
 *
 * @example
 * // Example with middleware for @Post decorator:
 * @Controller('/app')
 * class AppController {
 *   @Post('/create', [routeMid])
 *   createResource(ctx: ServerRequest) {
 *     ctx.send('Resource Created');
 *   }
 * }
 */
function createDecorator(method: RequestMethod) {
  return (path: string, middlewares?: MiddlewareFn[]): MethodDecorator => {
    if (!Object.values(RequestMethod).includes(method)) {
      throw new Error(`Invalid RequestMethod: ${method}`);
    }
    return (target, propertyKey, descriptor) => {
      if (!descriptor || typeof descriptor.value !== 'function') {
        throw new Error(`@${method} decorator must be applied to a method.`);
      }
      RouteNormalizer.validateMethod(target, propertyKey);
      const controllerPrefix = Reflector.get(RouterMetadataKeys.CONTROLLER_PREFIX, target.constructor);
      const normalizedPath = RouteNormalizer.normalizePath(path);
      const fullPath = RouteNormalizer.combinePaths(controllerPrefix, normalizedPath);
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

/**
 * HTTP method decorators for common HTTP methods. These decorators can be applied to controller methods
 * to map them to specific HTTP routes. Each decorator accepts a path and optional middleware functions.
 *
 * - @Get: Maps the method to a GET route.
 * - @Post: Maps the method to a POST route.
 * - @Put: Maps the method to a PUT route.
 * - @Delete: Maps the method to a DELETE route.
 * - @Patch: Maps the method to a PATCH route.
 * - @Options: Maps the method to an OPTIONS route.
 * - @Head: Maps the method to a HEAD route.
 * - @Search: Maps the method to a SEARCH route.
 */
export const Get = createDecorator(RequestMethod.Get);
export const Post = createDecorator(RequestMethod.Post);
export const Put = createDecorator(RequestMethod.Put);
export const Delete = createDecorator(RequestMethod.Delete);
export const Patch = createDecorator(RequestMethod.Patch);
export const Options = createDecorator(RequestMethod.Options);
export const Head = createDecorator(RequestMethod.Head);
export const Search = createDecorator(RequestMethod.Search);
export const All = createDecorator(RequestMethod.All);
