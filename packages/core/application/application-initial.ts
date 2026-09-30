import type { ImportableModule } from '@glandjs/common';
import { ChannelRegistryBuilder } from '@glandjs/common';
import type { Constructor, Logger } from '@medishn/toolkit';
import { DependenciesScanner, Explorer, type ModulesContainer } from '../injector';
import type { TGlandBroker } from '../types';
import { ApplicationBinder } from './application-binder';
import { ApplicationLifecycle } from './application-lifecycle';
import type { ProcessHookOptions } from '../hooks/process-hooks';

/** Options accepted when bootstrapping an application. */
export interface ApplicationOptions {
  /**
   * Emit verbose internal logging.
   *
   * Defaults to `true` when `GLAND_DEBUG` is set in the environment.
   */
  debug?: boolean;

  /** Forwarded to the lifecycle's process hooks. @see ProcessHookOptions */
  processHooks?: ProcessHookOptions;
}

/**
 * Runs the bootstrap sequence and owns the resulting lifecycle.
 *
 * The order below is the framework's contract, and each step is awaited before
 * the next begins:
 *
 * 1. register the module graph and construct every provider
 * 2. `onModuleInit` on every provider
 * 3. bind channels, then broadcast routes
 * 4. `onChannelInit` on every provider
 * 5. `onAppBootstrap` on every provider
 *
 * {@link ApplicationInitial.initialize} previously called without being
 * awaited from `GlandFactory.create()`, so steps 3-5 raced the caller. An
 * application could begin listening before its routes existed.
 */
export class ApplicationInitial {
  private readonly dependenciesScanner: DependenciesScanner;
  private readonly logger: Logger;
  private lifecycle?: ApplicationLifecycle;

  /**
   * Invoked with the binder once binding completes.
   *
   * @internal Set by `GlandFactory` so `GlandBroker` can replay routes to
   * adapters that attach after bootstrap.
   */
  public onBound?: (binder: ApplicationBinder) => void;

  constructor(
    private readonly broker: TGlandBroker,
    logger: Logger,
    private readonly debug = false,
    private readonly processHookOptions?: ProcessHookOptions,
  ) {
    this.logger = logger;
    this.dependenciesScanner = new DependenciesScanner(this.subLogger('Scanner'));
  }

  /**
   * The modules registered by {@link initialize}.
   *
   * @throws if called before initialization completes
   */
  public get modules(): ModulesContainer {
    return this.dependenciesScanner.modules;
  }

  /**
   * Executes the full bootstrap sequence.
   *
   * @param root - the application's entry module
   *
   * @throws whatever the scan, bind, or lifecycle phases throw — bootstrap
   *         failures must surface at startup, not on the first request
   */
  public async initialize<T>(root: Constructor<T> | ImportableModule<T>): Promise<void> {
    const log = this.subLogger('Initial');
    const say = (level: 'info' | 'error', message: string) => (log ? log[level](message) : void 0);

    try {
      say('info', 'Scanning module dependencies');
      await this.dependenciesScanner.scan(root);

      const explorer = new Explorer(this.dependenciesScanner.modules, this.subLogger('Explorer'));
      const registryBuilder = new ChannelRegistryBuilder();
      this.lifecycle = new ApplicationLifecycle(this.dependenciesScanner.modules, this.subLogger('Lifecycle'), this.processHookOptions);

      say('info', 'Running module initialization hooks');
      await this.lifecycle.init();

      say('info', 'Binding application components');
      const binder = new ApplicationBinder(explorer, this.broker, registryBuilder, this.subLogger('Binder'));
      binder.bind();

      // Let the broker replay these routes to adapters that attach later.
      this.onBound?.(binder);

      say('info', 'Running channel initialization hooks');
      await this.lifecycle.initChannels();

      say('info', 'Bootstrapping application');
      await this.lifecycle.bootstrap();

      say('info', 'Application initialized');
    } catch (error) {
      say('error', `Application initialization failed: ${(error as Error)?.message ?? error}`);
      throw error;
    }
  }

  /**
   * Runs the shutdown phases and releases process handlers.
   *
   * @param signal - the signal that triggered shutdown, if any
   */
  public async shutdown(signal?: string): Promise<void> {
    await this.lifecycle?.shutdown(signal);
  }

  /**
   * Returns a child logger, or `undefined` when debug logging is off.
   *
   * Callers use `logger?.` throughout, so a single check here is enough to
   * silence the whole bootstrap path.
   */
  private subLogger(context: string): Logger | undefined {
    return this.debug ? this.logger.child(context) : undefined;
  }
}
