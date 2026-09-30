import { INJECT_METADATA } from '../../constant';
import type { InjectionToken } from '../../types';

/**
 * A lazily-resolved injection token, used to break dependency cycles.
 *
 * The callback is not invoked until the token is actually needed, which is
 * what makes circular references expressible.
 */
export interface ForwardRef<T = unknown> {
  /** Brand used to distinguish a forward ref from a plain token at resolve time. */
  readonly forwardRef: true;
  /** Returns the real token. */
  resolve(): T | InjectionToken;
}

const FORWARD_REF = Symbol('gland:forwardRef');

/** @internal Narrowing guard for {@link forwardRef} values. */
export function isForwardRef(value: unknown): value is ForwardRef {
  return typeof value === 'object' && value !== null && FORWARD_REF in value;
}

/**
 * Defers *token lookup* so a provider can depend on one declared later in the
 * file.
 *
 * Decorator arguments are evaluated when the class is defined, so a direct
 * reference to a class declared below it hits the temporal dead zone:
 *
 * ```ts
 * class Consumer {
 *   constructor(@Inject(B) private b: B) {}   // ReferenceError: Cannot access 'B'
 * }
 * class B {}                                   // ...but B is not defined yet
 * ```
 *
 * Wrapping the lookup in a thunk fixes that, because nothing is read until the
 * container actually resolves the parameter:
 *
 * ```ts
 * class Consumer {
 *   constructor(@Inject(forwardRef(() => B)) private b: B) {}
 * }
 * class B {}
 * ```
 *
 * ### What this does not do
 *
 * It does not make mutual constructor injection work. If `B` in turn needs
 * `Consumer` *eagerly*, no ordering can satisfy both, and the container raises
 * a {@link CircularDependencyError} naming the whole cycle. Break such a
 * design by extracting the shared state into a third provider, or by injecting
 * a factory instead of the instance.
 *
 * @param tokenFn - thunk returning the real token
 */
export function forwardRef<T>(tokenFn: () => T | InjectionToken): ForwardRef<T> {
  return {
    // Brand on the value itself, so {@link isForwardRef} can recognise a
    // forward ref without the public `forwardRef: true` field being spoofable
    // or, worse, forgotten.
    [FORWARD_REF]: true,
    forwardRef: true,
    resolve: tokenFn,
  } as ForwardRef<T>;
}

/**
 * Injects a provider that cannot be inferred from the TypeScript type alone.
 *
 * Required whenever the constructor parameter is an interface, a primitive
 * wrapper, a string, or a symbol — all of which erase to `Object` in emitted
 * decorator metadata. Without `@Inject` the container would silently hand the
 * provider a bare `{}`.
 *
 * ```ts
 * class UserService {
 *   constructor(
 *     @Inject(USER_REPOSITORY) private users: UserRepository, // interface
 *     @Inject('featureFlags') private flags: Record<string, boolean>, // string token
 *   ) {}
 * }
 * ```
 *
 * @param token - provider class, string token, or symbol token
 */
export function Inject(token: InjectionToken): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const constructor = propertyKey === undefined ? target : target.constructor;
    if (!constructor) {
      throw new Error('@Inject can only be applied to constructor parameters of a class.');
    }

    const existing: InjectionToken[] = Reflect.getOwnMetadata(INJECT_METADATA, constructor) ?? [];
    // Copy-on-write: the same class may be decorated in several places, and
    // mutating a shared array would leak tokens across those sites.
    const next = existing.slice();
    next[parameterIndex] = token;
    Reflect.defineMetadata(INJECT_METADATA, next, constructor);
  };
}

/**
 * Reads the `@Inject` token registered for a constructor parameter, if any.
 *
 * @param constructor - the provider class
 * @param parameterIndex - zero-based parameter position
 */
export function getInjectToken(constructor: Function, parameterIndex: number): InjectionToken | undefined {
  const tokens: InjectionToken[] | undefined = Reflect.getOwnMetadata(INJECT_METADATA, constructor);
  return tokens?.[parameterIndex];
}
