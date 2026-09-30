/**
 * Metadata keys and well-known event names shared across Gland packages.
 *
 * These values are written into `Reflect` metadata by the decorators in
 * `@glandjs/common` and read back by the scanners in `@glandjs/core`.
 * They are part of the public contract between the two packages — changing a
 * value here requires a coordinated change on both sides.
 *
 * @packageDocumentation
 */

/**
 * Path segment used by {@link Controller} (e.g. `@Controller('products')`)
 * and by {@link Channel} (e.g. `@Channel('db')`).
 *
 * Stored on the class constructor itself.
 */
export const PATH_METADATA = 'path';

/**
 * Event name for `@Get()`/`@Post()`/… route decorators, or the event name of
 * an `@On()` channel handler.
 *
 * Stored on the method's *function object* for route decorators, and on the
 * prototype keyed by method name for `@On()`.
 */
export const METHOD_METADATA = 'method';

/**
 * Module definition attached by the `@Module({...})` decorator.
 *
 * Stored on the module class constructor.
 */
export const MODULE_METADATA = '__module__';

/**
 * Per-parameter constructor injection tokens attached by
 * `@Inject(token)`, keyed by parameter index.
 *
 * Stored on the class constructor itself (parameters are not reachable from
 * the prototype, so this cannot live on the method).
 */
export const INJECT_METADATA = '__inject__';

/**
 * Broadcast event emitted by the application binder, once per discovered
 * route. Protocol adapters subscribe to it to register routes on themselves.
 *
 * @see {@link GlandRoute} for the payload shape.
 */
export const GLAND_ROUTE_EVENT = 'gland:define:route';

/**
 * Prefix of the fully-qualified event name that backs a single channel
 * handler. The full name is built by `buildChannelEventName()`.
 *
 * @see buildChannelEventName
 */
export const GLAND_CHANNEL_EVENT = 'gland:define:channel';
