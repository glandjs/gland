import type { InjectionToken } from '@glandjs/common';
import type { Constructor } from '@medishn/toolkit';
import { InstanceWrapper } from './instance-wrapper';

/**
 * A registered module: its identity, its resolved instance, and the providers
 * it owns.
 *
 * Named `ModuleRef` rather than `Module` so it never collides with the
 * `@Module()` decorator exported by `@glandjs/common` — both were previously
 * importable under the same name, which made any file needing both unreadable.
 *
 * @typeParam T - the module class instance type
 */
export class ModuleRef<T = any> {
  /**
   * Modules this module imports, already registered.
   *
   * A `Set`, because a diamond dependency (A and B both import C) is normal
   * and must not create two entries.
   */
  public readonly imports = new Set<ModuleRef>();

  /** Controllers owned by this module, keyed by their class. */
  public readonly controllers = new Map<InjectionToken, InstanceWrapper<any>>();

  /** Channels owned by this module, keyed by their class. */
  public readonly channels = new Map<InjectionToken, InstanceWrapper<any>>();

  private _instance?: T;

  constructor(
    /**
     * Stable identifier for the module, derived from the class name or
     * `DynamicModule.module.name`.
     */
    public readonly token: string,

    /** The module class. */
    public readonly metatype: Constructor<T>,
  ) {}

  /** The module's own instance, built by the container. */
  get instance(): T | undefined {
    return this._instance;
  }

  /**
   * Records the module's resolved instance.
   *
   * Called once by the container, so that lifecycle hooks run against the very
   * same object the rest of the application uses.
   */
  setInstance(instance: T): void {
    this._instance = instance;
  }

  /** Adds imported modules, ignoring ones already registered. */
  public addImports(imports: ModuleRef[]): void {
    for (const imported of imports) {
      this.imports.add(imported);
    }
  }

  /**
   * Registers a controller, replacing any wrapper previously stored under the
   * same token.
   */
  public addController(controller: Constructor, instance?: any): void {
    this.controllers.set(controller, new InstanceWrapper(controller, instance));
  }

  /**
   * Registers a channel, replacing any wrapper previously stored under the same
   * token.
   */
  public addChannel(channel: Constructor, instance?: any): void {
    this.channels.set(channel, new InstanceWrapper(channel, instance));
  }
}
