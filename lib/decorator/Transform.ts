import { RouterMetadataKeys } from '../common/enums';
import { TransformContext } from '../common/interfaces';
import Reflector from '../metadata';
/**
 * @module Transform
 * @description
 * The `@Transform` decorator is used to apply a transformation function to the request context.
 * It allows pre-processing or manipulation of the request data such as parameters, body, query, headers, and more
 * before the route handler is executed.
 *
 * The decorator registers a transformation function to be executed during request processing,
 * enabling fine-grained control over the incoming request context.
 *
 * @param {Function} transformFn - The transformation function that takes a `TransformContext` as an argument.
 *
 * @example
 * ```typescript
 * import { Transform } from './decorators/Transform';
 * import { TransformContext } from './common/interfaces';
 *
 * class ExampleController {
 *   @Transform((ctx: TransformContext) => {
 *     // Example: Modify the request body
 *     if (ctx.body) {
 *       ctx.body.modified = true;
 *     }
 *   })
 *   public handleRequest() {
 *     console.log('Request handled');
 *   }
 * }
 * ```
 */
export function Transform(transformFn: (ctx: TransformContext) => void): MethodDecorator {
  return (target, propertyKey) => {
    Reflector.define(RouterMetadataKeys.TRANSFORM, transformFn, target.constructor, propertyKey);
  };
}
