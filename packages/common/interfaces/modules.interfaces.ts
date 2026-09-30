import type { Constructor } from '@medishn/toolkit';
import type { ImportableModule, InjectionToken } from '../types';

/**
 * The object passed to `@Module({...})`.
 *
 * @typeParam T - the instance type produced by the module's providers
 */
export interface ModuleMetadata<T = any> {
  /**
   * Modules to register before this one. May contain module classes, dynamic
   * modules, or promises of either (useful for breaking import cycles).
   *
   * Imports are transitive: everything they pull in is registered too.
   */
  imports?: ImportableModule<T>[];

  /**
   * Classes exposing HTTP route handlers. Each is instantiated once and
   * scanned for `@Get()`/`@Post()`/… decorators.
   */
  controllers?: Constructor<T>[];

  /**
   * Classes exposing event handlers. Each is instantiated once and scanned for
   * `@On()` decorators.
   */
  channels?: Constructor<T>[];
}

/**
 * A module defined at runtime instead of via the `@Module()` decorator — for
 * example when the controller list is computed from a config value.
 *
 * ```ts
 * @Module({ controllers: [HealthController] })
 * class AppModule {}
 *
 * const modules = [AppModule, { module: TenantModule, controllers: tenantControllers }];
 * ```
 *
 * @typeParam T - the instance type produced by the module's providers
 */
export interface DynamicModule<T = any> {
  /** The module class whose `@Module()` metadata provides the baseline. */
  module: Constructor<any>;

  /**
   * Controllers merged with the ones declared by `module`'s `@Module()`.
   * Required — a dynamic module with no controllers declares nothing.
   */
  controllers?: Constructor<T>[];

  /** Channels merged with the ones declared by `module`'s `@Module()`. */
  channels?: Constructor<T>[];

  /** Extra modules to register alongside `module`'s own imports. */
  imports?: ImportableModule<T>[];
}
