/**
 * Marks a class as a dependency-injection provider.
 *
 * ### Why this is required
 *
 * TypeScript's `emitDecoratorMetadata` only writes `design:paramtypes` for
 * classes that carry at least one decorator. A plain class therefore reaches
 * the container with *no* parameter information, and its constructor receives
 * `undefined` for every dependency — silently, and only at runtime.
 *
 * Applying any decorator opts the class in, but that is an implicit contract
 * nobody can see. `@Injectable()` makes it explicit: the presence of the
 * decorator is the declaration that this class wants its constructor resolved.
 *
 * ```ts
 * @Injectable()
 * export class UserService {
 *   constructor(private users: UserRepository) {}
 * }
 * ```
 *
 * @see Inject — for parameters whose type erases to `Object`
 */
export function Injectable(): ClassDecorator {
  return (target: Function) => {
    // The decorator's mere presence is what makes the compiler emit
    // `design:paramtypes`; no metadata of its own is needed.
    if (!Reflect.hasOwnMetadata('__gland:injectable__', target)) {
      Reflect.defineMetadata('__gland:injectable__', true, target);
    }
  };
}

/**
 * Whether a class was explicitly marked with {@link Injectable}.
 *
 * @internal Exported for the container's own diagnostics.
 */
export function isInjectable(metatype: Function): boolean {
  return Reflect.getMetadata('__gland:injectable__', metatype) === true;
}
