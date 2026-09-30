import type { Constructor } from '@medishn/toolkit';
import type { DynamicModule } from '../interfaces';
import type { ForwardRef } from '../decorators/core/inject.decorator';

/**
 * A dynamic module, or a promise resolving to one.
 *
 * The promise form exists to break a module import cycle: the arrow function
 * passed to `Promise.resolve` is only invoked after both modules are defined.
 */
export type ImportableModule<T = any> = Constructor<T> | DynamicModule<T> | Promise<DynamicModule<T>>;

/**
 * Anything that can identify a provider.
 *
 * - a class (constructed, with its own parameters resolved recursively)
 * - a `string` or `symbol` token, usable only with `@Inject(token)`
 * - a `forwardRef(...)` wrapper, which the container unwraps before resolving
 */
export type InjectionToken<T = any> = string | symbol | Constructor<T> | Function | ForwardRef<T>;
