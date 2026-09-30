import { MODULE_METADATA } from '../../constant';
import type { ModuleMetadata } from '../../interfaces';

/**
 * Declares a module: a unit of composition holding controllers and channels,
 * and importing other modules.
 *
 * The module tree is walked once during bootstrap. Everything reachable from
 * the root module passed to `GlandFactory.create()` is registered, instantiated,
 * and bound.
 *
 * @param metadata - the module's controllers, channels, and imports
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [ProductModule],
 *   controllers: [ProductController],
 *   channels: [Database],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Lazy module — imported as a promise to break a construction cycle
 * ```ts
 * @Module({ imports: [Promise.resolve(() => require('./lazy').LazyModule)] })
 * export class AppModule {}
 * ```
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(MODULE_METADATA, metadata, target);
  };
}
