import { METHOD_METADATA } from '../../constant';

/**
 * Binds a channel method to an event.
 *
 * The event name is scoped by the enclosing class's `@Channel()` namespace.
 * The method becomes reachable through `ctx.emit()` (fire-and-forget) and
 * `ctx.call()` (request/response, returns the method's value).
 *
 * @param event - event name, without the channel namespace
 *
 * @example
 * ```ts
 * @Channel('db')
 * export class Database {
 *   @On('product:create')
 *   create(input: NewProduct): Product {
 *     // ...
 *   }
 * }
 * // ctx.call('db:product:create', input) -> Product
 * ```
 */
export function On(event: string): MethodDecorator {
  return (target: object, key: string | symbol) => {
    Reflect.defineMetadata(METHOD_METADATA, event, target, key);
  };
}
