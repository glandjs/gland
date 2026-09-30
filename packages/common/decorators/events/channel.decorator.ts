import { PATH_METADATA } from '../../constant';

/**
 * Marks a class as an event channel and sets its namespace.
 *
 * The namespace prefixes every `@On()` event declared inside the class, so
 * `@Channel('db')` + `@On('product:create')` is addressed as
 * `'db:product:create'` from anywhere in the application.
 *
 * The namespace may be omitted, in which case handlers are addressed by their
 * bare event name. Every resulting name must be globally unique — the binder
 * throws at startup on a collision.
 *
 * @param namespace - event namespace; omit for an unnamespaced channel
 *
 * @example
 * ```ts
 * @Channel('db')
 * export class Database {
 *   @On('product:create')
 *   create(input: NewProduct): Product { /* ... *\/ }
 * }
 * // addressed as: ctx.call('db:product:create', input)
 * ```
 */
export function Channel(namespace?: string): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(PATH_METADATA, namespace ?? '', target);
  };
}
