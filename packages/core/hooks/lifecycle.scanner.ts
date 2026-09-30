import type { Logger } from '@medishn/toolkit';
import type { ModuleRef, ModulesContainer } from '../injector';
import type { InstanceWrapper } from '../injector/instance-wrapper';

/**
 * A lifecycle method a provider may implement.
 *
 * All are optional; only the ones a provider actually declares are invoked.
 */
export type LifecycleHook = 'onModuleInit' | 'onModuleDestroy' | 'onAppBootstrap' | 'onAppShutdown' | 'onChannelInit';

/** What kind of component a lifecycle participant is. */
export type LifecycleComponentType = 'module' | 'controller' | 'channel';

/** Every lifecycle hook, in invocation order during bootstrap. */
export const LIFECYCLE_HOOKS: readonly LifecycleHook[] = ['onModuleInit', 'onModuleDestroy', 'onAppBootstrap', 'onAppShutdown', 'onChannelInit'];

/** A resolved provider that participates in at least one hook. */
export interface LifecycleComponent {
  /** The provider instance the hook is invoked on. */
  instance: any;
  /** Token of the owning module. */
  moduleToken: string;
  /** Which map the provider came from. */
  componentType: LifecycleComponentType;
  /** Token identifying the provider within its module. */
  componentToken: string;
}

/**
 * Finds providers implementing lifecycle hooks and runs them.
 *
 * Providers are collected once, up front, then invoked per phase. Hooks run
 * concurrently within a phase (`Promise.all`) but phases are strictly
 * ordered, which is what makes `onModuleInit` safe to depend on when
 * `onAppBootstrap` runs.
 *
 * Hook invocation order across providers is registration order, i.e. the order
 * modules were discovered.
 */
export class LifecycleScanner {
  /** moduleToken -> providers from that module that implement a hook. */
  private readonly participants = new Map<string, Set<LifecycleComponent>>();
  private readonly logger?: Logger;
  private scanned = false;

  constructor(
    private readonly modulesContainer: ModulesContainer,
    logger?: Logger,
  ) {
    this.logger = logger?.child('LifecycleScanner');
  }

  /**
   * Walks every module and records the providers that implement a hook.
   *
   * Must run before any `on*` phase. Idempotent, so a second call is a no-op
   * rather than a duplicate registration.
   */
  public scanForHooks(): void {
    if (this.scanned) return;
    this.logger?.debug('Scanning for lifecycle hooks...');

    for (const [moduleToken, moduleRef] of this.modulesContainer.entries()) {
      const found = new Set<LifecycleComponent>();

      this.addModuleParticipant(moduleToken, moduleRef, found);
      this.addProviderParticipants(moduleToken, moduleRef.controllers, 'controller', found);
      this.addProviderParticipants(moduleToken, moduleRef.channels, 'channel', found);

      this.participants.set(moduleToken, found);
    }

    this.scanned = true;
    this.logger?.debug(`Found lifecycle participants in ${this.participants.size} module(s)`);
  }

  /**
   * Records a module class itself as a participant.
   *
   * Uses the instance the container already built. It previously called
   * `new module.metatype()`, which handed hooks a throwaway object with no
   * dependency injection — so a module's constructor work and the state it
   * kept were discarded.
   */
  private addModuleParticipant(moduleToken: string, moduleRef: ModuleRef, found: Set<LifecycleComponent>): void {
    const instance = moduleRef.instance;
    if (!instance || !this.hasAnyHook(instance)) return;

    found.add({ instance, moduleToken, componentType: 'module', componentToken: moduleToken });
    this.logger?.debug(`module "${moduleToken}" registered for lifecycle hooks`);
  }

  /** Records each provider in `providers` that implements a hook. */
  private addProviderParticipants(moduleToken: string, providers: Map<unknown, InstanceWrapper>, componentType: LifecycleComponentType, found: Set<LifecycleComponent>): void {
    for (const [token, wrapper] of providers.entries()) {
      const instance = wrapper.tryGetInstance();
      if (instance === undefined || !this.hasAnyHook(instance)) continue;

      const componentToken = typeof token === 'function' ? token.name : String(token);
      found.add({ instance, moduleToken, componentType, componentToken });
      this.logger?.debug(`${componentType} "${componentToken}" registered for lifecycle hooks`);
    }
  }

  /**
   * Invokes `hook` on every provider that implements it.
   *
   * A provider that throws is logged and skipped rather than aborting the
   * phase, so one broken hook cannot prevent the rest of the application from
   * starting or shutting down.
   *
   * @param hook - the hook to run
   * @param signal - the shutdown signal, forwarded to `onAppShutdown`
   */
  public async runHook(hook: LifecycleHook, signal?: string): Promise<void> {
    this.logger?.debug(`Running "${hook}"`);

    const pending: Array<Promise<unknown>> = [];

    for (const components of this.participants.values()) {
      for (const component of components) {
        if (!this.hasHook(component.instance, hook)) continue;

        try {
          const result = hook === 'onAppShutdown' ? component.instance[hook](signal) : component.instance[hook]();
          if (result && typeof (result as Promise<unknown>).then === 'function') {
            pending.push(result as Promise<unknown>);
          }
        } catch (error) {
          this.logger?.error(`"${hook}" threw on ${component.componentType} "${component.componentToken}": ${(error as Error)?.message ?? error}`);
        }
      }
    }

    if (pending.length) {
      const settled = await Promise.allSettled(pending);
      settled.forEach((result, index) => {
        if (result.status === 'rejected') {
          this.logger?.error(`"${hook}" rejected for participant #${index}: ${(result.reason as Error)?.message ?? result.reason}`);
        }
      });
    }

    this.logger?.debug(`Completed "${hook}"`);
  }

  /** Invokes `onModuleInit` on every provider implementing it. */
  public async onModuleInit(): Promise<void> {
    await this.runHook('onModuleInit');
  }

  /** Invokes `onChannelInit` on every provider implementing it. */
  public async onChannelInit(): Promise<void> {
    await this.runHook('onChannelInit');
  }

  /** Invokes `onAppBootstrap` on every provider implementing it. */
  public async onAppBootstrap(): Promise<void> {
    await this.runHook('onAppBootstrap');
  }

  /** Invokes `onAppShutdown`, forwarding `signal`. */
  public async onAppShutdown(signal?: string): Promise<void> {
    await this.runHook('onAppShutdown', signal);
  }

  /** Invokes `onModuleDestroy` on every provider implementing it. */
  public async onModuleDestroy(): Promise<void> {
    await this.runHook('onModuleDestroy');
  }

  private hasAnyHook(instance: unknown): boolean {
    return LIFECYCLE_HOOKS.some((hook) => this.hasHook(instance, hook));
  }

  private hasHook(instance: unknown, hook: LifecycleHook): boolean {
    return !!instance && typeof (instance as Record<string, unknown>)[hook] === 'function';
  }
}
