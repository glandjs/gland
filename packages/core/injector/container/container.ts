import { getInjectToken, isDynamicModule, isForwardRef, MODULE_METADATA, type ImportableModule, type InjectionToken, type ModuleMetadata } from '@glandjs/common';
import type { Constructor, Logger } from '@medishn/toolkit';
import { InstanceWrapper } from '../instance-wrapper';
import { ModuleRef } from '../module';
import { ModulesContainer } from './module-container';

/**
 * Raised when provider construction forms a cycle that no `forwardRef` breaks.
 */
export class CircularDependencyError extends Error {
  constructor(public readonly cycle: readonly string[]) {
    super(`Cannot resolve circular dependency:\n  ${cycle.join('\n  -> ')}\n\nBreak the cycle with @Inject(forwardRef(() => Token)) on at least one link.`);
    this.name = 'CircularDependencyError';
  }
}

/**
 * Raised when a constructor parameter cannot be mapped to a provider.
 */
export class UnresolvableDependencyError extends Error {
  constructor(
    public readonly owner: string,
    public readonly parameterIndex: number,
    detail: string,
  ) {
    super(`Cannot resolve constructor parameter #${parameterIndex} of "${owner}".\n  ${detail}`);
    this.name = 'UnresolvableDependencyError';
  }
}

/**
 * Values handed to parameters whose reflected type is a built-in wrapper.
 *
 * Keyed by prototype. A `Map` rather than an object literal: computed keys such
 * as `[Symbol.prototype]` would be coerced to strings when used as object keys,
 * and the lookup would miss.
 *
 * Injecting `new String('x')` where the author wrote `x: string` would be
 * surprising, so the intrinsic value is used instead.
 */
const INTRINSIC_DEFAULTS = new Map<unknown, unknown>([
  [String.prototype, ''],
  [Number.prototype, 0],
  [Boolean.prototype, false],
]);

/**
 * The dependency graph node, identified by its normalised token.
 *
 * Kept as a flat map rather than a tree: the module tree is already
 * navigable through {@link ModuleRef.imports}, and a second structure tracking
 * the same relationships could only drift out of sync.
 */
class ResolutionState {
  /** Providers already built, keyed by token. */
  public readonly instances = new Map<InjectionToken, unknown>();

  /**
   * Tokens currently being constructed, in construction order.
   *
   * Doubles as the path reported in a {@link CircularDependencyError}, and
   * distinguishes an in-progress cycle from a provider that simply has not
   * been requested yet.
   */
  public readonly resolving: InjectionToken[] = [];

  public isResolving(token: InjectionToken): boolean {
    return this.resolving.includes(token);
  }
}

/**
 * Registers the module graph, instantiates providers, and hands out singletons.
 *
 * One container exists per application. Every provider is a singleton: the
 * first `resolve()` builds it, later calls return the same instance.
 *
 * @example
 * ```ts
 * const container = new Container(logger);
 * const appModule = await container.register(AppModule);
 * const productService = container.resolve(ProductService);
 * ```
 */
export class Container {
  private readonly modules = new ModulesContainer();
  private readonly state = new ResolutionState();
  private readonly logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger?.child('Container');
  }

  /** Every module registered so far, keyed by token. */
  public get moduleContainer(): ModulesContainer {
    return this.modules;
  }

  /**
   * Registers a module and, transitively, everything it imports.
   *
   * Registration is idempotent: a module already present in the container is
   * returned untouched, so diamond dependencies converge on one instance.
   *
   * @param module - a module class, or a dynamic module
   * @param parentToken - token of the importing module, for diagnostics
   *
   * @throws {CircularDependencyError} if module imports form a cycle
   */
  public async register<T>(module: Constructor<T> | ImportableModule<T>, parentToken?: string): Promise<ModuleRef<T>> {
    const resolved = await unwrapModule(module);
    const { moduleClass, metadata } = this.normalizeModule(resolved);
    const token = this.getId(moduleClass);

    const existing = this.modules.getByToken(token);
    if (existing) {
      this.logger?.debug(`Module "${token}" already registered`);
      return existing as ModuleRef<T>;
    }

    if (this.state.isResolving(moduleClass)) {
      throw new CircularDependencyError([...this.state.resolving, moduleClass].map((t) => this.getId(t)));
    }

    this.logger?.debug(`Registering module "${token}"`);
    const moduleRef = new ModuleRef<T>(token, moduleClass);
    this.modules.set(token, moduleRef);

    // The module class is resolved through the normal path so it shares the
    // singleton cache and cycle guard with every other provider.
    moduleRef.setInstance(this.resolve(moduleClass));

    this.state.resolving.push(moduleClass);
    try {
      await this.processImports(moduleRef, metadata.imports ?? [], token);
      this.processControllers(moduleRef, metadata.controllers ?? []);
      this.processChannels(moduleRef, metadata.channels ?? []);
    } finally {
      this.state.resolving.pop();
    }

    this.logger?.debug(`- Registered module "${token}"`);
    return moduleRef;
  }

  /**
   * Builds — or returns the cached singleton for — the provider identified by
   * `token`.
   *
   * Constructor parameters are satisfied in this order:
   * 1. an explicit `@Inject(token)` / `@Inject(forwardRef(...))` token
   * 2. `design:paramtypes` metadata emitted by the TypeScript compiler
   *
   * @throws {UnresolvableDependencyError} if a parameter has no usable token
   * @throws {CircularDependencyError} if construction forms a cycle
   */
  public resolve<T>(token: InjectionToken<T>): T {
    // Unwrap a deferred lookup before anything else, so the cache and the cycle
    // guard both key on the real token rather than on a fresh wrapper object.
    const effective = (isForwardRef(token) ? token.resolve() : token) as InjectionToken<T>;

    if (this.state.instances.has(effective)) {
      return this.state.instances.get(effective) as T;
    }

    if (typeof effective === 'string' || typeof effective === 'symbol') {
      throw new UnresolvableDependencyError(String(effective), 0, `Token "${String(effective)}" is not bound to a provider. String and symbol tokens can only be used through @Inject().`);
    }

    if (this.state.isResolving(effective)) {
      throw new CircularDependencyError([...this.state.resolving, effective].map((t) => this.getId(t)));
    }

    // Mark as in-progress *before* walking dependencies. A -> B -> A closes the
    // loop during B's own resolution, so A must already be on the stack by then;
    // pushing afterwards let the cycle recurse until the stack overflowed.
    this.state.resolving.push(effective);

    let instance: T;
    try {
      const dependencies = this.resolveDependencies(effective as Constructor<T>);
      instance = new (effective as Constructor<T>)(...dependencies);
    } finally {
      this.state.resolving.pop();
    }

    this.state.instances.set(effective, instance);
    this.logger?.debug(`Resolved "${this.getId(effective)}"`);
    return instance;
  }

  /** Whether a provider has already been built for `token`. */
  public has(token: InjectionToken): boolean {
    return this.state.instances.has(token);
  }

  /**
   * Binds `token` to an existing value.
   *
   * The escape hatch for providers the container cannot build: a configuration
   * object, a third-party client, a value that needs a conditional. The value
   * is used verbatim, so the caller owns its lifetime.
   *
   * ```ts
   * container.bind('featureFlags', { beta: true });
   * ```
   *
   * @throws if a provider is already registered for `token` — rebinding an
   *         existing provider would make resolution order-dependent, and a
   *         silent override is far harder to notice than a refusal
   */
  public bind<T>(token: InjectionToken, value: T): T {
    if (this.state.instances.has(token)) {
      throw new Error(`Cannot bind "${this.getId(token)}": a provider is already registered for it. ` + 'Use a distinct token, or resolve the existing provider.');
    }
    this.state.instances.set(token, value);
    this.logger?.debug(`Bound "${this.getId(token)}"`);
    return value;
  }

  /** Normalises a class or dynamic module into `{ moduleClass, metadata }`. */
  private normalizeModule<T>(module: Constructor<T> | ({ module: Constructor<T> } & Partial<ModuleMetadata<T>>)): {
    moduleClass: Constructor<T>;
    metadata: ModuleMetadata<T>;
  } {
    if (isDynamicModule(module)) {
      const dynamic = module as { module: Constructor<T> } & Partial<ModuleMetadata<T>>;
      const base = this.readMetadata(dynamic.module);
      return {
        moduleClass: dynamic.module,
        metadata: {
          imports: [...(base.imports ?? []), ...(dynamic.imports ?? [])],
          controllers: [...(base.controllers ?? []), ...(dynamic.controllers ?? [])],
          channels: [...(base.channels ?? []), ...(dynamic.channels ?? [])],
        },
      };
    }

    return { moduleClass: module as Constructor<T>, metadata: this.readMetadata(module as Constructor<T>) };
  }

  /** Reads `@Module()` metadata, defaulting to an empty definition. */
  private readMetadata<T>(moduleClass: Constructor<T>): ModuleMetadata<T> {
    return Reflect.getMetadata(MODULE_METADATA, moduleClass) ?? { imports: [], controllers: [], channels: [] };
  }

  /** Builds the constructor argument list for `metatype`. */
  private resolveDependencies<T>(metatype: Constructor<T>): unknown[] {
    const paramTypes: unknown[] = Reflect.getMetadata('design:paramtypes', metatype) ?? [];
    const arity = metatype.length;
    const count = Math.max(paramTypes.length, arity);

    // The compiler only writes `design:paramtypes` for a class that carries a
    // decorator. A class with a real constructor but no emitted metadata wants
    // dependencies the container cannot see, so say so instead of handing over
    // a row of `undefined`s.
    if (count > 0 && paramTypes.length === 0) {
      throw new UnresolvableDependencyError(
        metatype.name || 'anonymous class',
        0,
        'The constructor takes arguments but no "design:paramtypes" metadata was emitted for it.\n' +
          '  TypeScript only emits that metadata for decorated classes: add @Injectable()\n' +
          '  (or any other Gland decorator) to this class, and keep\n' +
          '  "experimentalDecorators" and "emitDecoratorMetadata" enabled in tsconfig.json.',
      );
    }

    const dependencies = new Array<unknown>(count);
    for (let index = 0; index < count; index++) {
      dependencies[index] = this.resolveParameter(metatype, index, paramTypes[index]);
    }
    return dependencies;
  }

  /** Resolves a single constructor parameter. */
  private resolveParameter(metatype: Constructor, index: number, reflectedType: unknown): unknown {
    const explicit = getInjectToken(metatype, index);
    if (explicit !== undefined) {
      const token = isForwardRef(explicit) ? explicit.resolve() : explicit;
      return this.resolve(token as InjectionToken);
    }

    if (reflectedType === undefined) {
      throw new UnresolvableDependencyError(
        metatype.name || 'anonymous class',
        index,
        'No design:paramtypes metadata and no @Inject() token. Enable "emitDecoratorMetadata" in tsconfig.json, or annotate the parameter with @Inject(token).',
      );
    }

    // Built-in wrapper types. `emitDecoratorMetadata` emits `String`/`Number`/…
    // for primitive parameters, and a container is not obliged to manufacture a
    // `new String()` — it hands over the intrinsic instead.
    if (typeof reflectedType === 'function' && INTRINSIC_DEFAULTS.has(reflectedType.prototype)) {
      return INTRINSIC_DEFAULTS.get(reflectedType.prototype);
    }

    // Interfaces, primitives and index-signature types all erase to `Object`.
    // Constructing it would hand the provider a silent `{}` instead of failing.
    if (reflectedType === Object) {
      throw new UnresolvableDependencyError(
        metatype.name || 'anonymous class',
        index,
        `The parameter's type erased to "Object" at runtime (interface, primitive, or union).\n  Annotate it with @Inject(Token) so the container knows what to build.`,
      );
    }

    return this.resolve(reflectedType as InjectionToken);
  }

  /** Registers every module named by `imports`. */
  private async processImports(module: ModuleRef, imports: ImportableModule[], parentToken: string): Promise<void> {
    for (const imported of imports) {
      const importedRef = await this.register(imported, parentToken);
      module.addImports([importedRef]);
    }
  }

  /** Instantiates and attaches every controller named by the module. */
  private processControllers(module: ModuleRef, controllers: Constructor[]): void {
    for (const controller of controllers) {
      const instance = this.resolve(controller);
      module.addController(controller, instance);
      this.logger?.debug(`  controller "${controller.name}"`);
    }
  }

  /** Instantiates and attaches every channel named by the module. */
  private processChannels(module: ModuleRef, channels: Constructor[]): void {
    for (const channel of channels) {
      const instance = this.resolve(channel);
      module.addChannel(channel, instance);
      this.logger?.debug(`  channel "${channel.name}"`);
    }
  }

  /** Normalises a token into the string used as a module key. */
  private getId(token: InjectionToken): string {
    if (typeof token === 'string') return token;
    if (typeof token === 'symbol') return token.description ?? token.toString();
    if (isForwardRef(token)) return this.getId(token.resolve() as InjectionToken);
    if (typeof token === 'function') return token.name || 'anonymous';
    return 'anonymous';
  }
}

/**
 * Awaits a promise-shaped import, returning the module definition it holds.
 *
 * `Promise.resolve(() => require('./lazy').LazyModule)` is the documented way
 * to break a module cycle; the thunk is only invoked here, after both modules
 * exist.
 */
async function unwrapModule<T>(module: Constructor<T> | ImportableModule<T>): Promise<Constructor<T> | { module: Constructor<T> }> {
  if (module instanceof Promise) {
    return unwrapModule((await module) as Constructor<T> | { module: Constructor<T> });
  }
  return module as Constructor<T> | { module: Constructor<T> };
}

export { InstanceWrapper, ModuleRef, ModulesContainer };
