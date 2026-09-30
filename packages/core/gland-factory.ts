import type { ImportableModule } from '@glandjs/common';
import { Logger, type Constructor } from '@medishn/toolkit';
import { ApplicationInitial, type ApplicationOptions } from './application';
import { GlandBroker } from './gland-broker';

/**
 * The running application: a core bus plus the handles needed to shut it down.
 *
 * Returned by {@link GlandFactory.create}. Hold on to it — `GlandFactory`
 * itself is a one-shot bootstrapper and is not needed afterwards.
 */
export interface GlandApplication {
  /** The core bus and adapter registry. */
  readonly app: GlandBroker;
  /** Runs the shutdown phases. @see ApplicationInitial.shutdown */
  shutdown(signal?: string): Promise<void>;
}

/**
 * Bootstraps a Gland application.
 *
 * @example Minimal application
 * ```ts
 * import { GlandFactory } from '@glandjs/core';
 *
 * const { app, shutdown } = await GlandFactory.create(AppModule);
 * const express = app.connectTo(ExpressBroker);
 * express.listen(3000);
 *
 * process.on('SIGTERM', () => void shutdown('SIGTERM'));
 * ```
 */
export class GlandFactory {
  /** Whether `GLAND_DEBUG` is set, enabling verbose internal logging. */
  public static get debugMode(): boolean {
    return !!process.env.GLAND_DEBUG;
  }

  /**
   * Registers the module graph, runs every lifecycle phase, and returns the
   * application.
   *
   * Resolves only once binding is complete, so routes and channels are
   * guaranteed to exist by the time the caller starts listening.
   *
   * @param root - the application's entry module
   * @param options - debug logging and process-hook behaviour
   *
   * @throws whatever the bootstrap sequence throws
   */
  public static async create<T>(root: Constructor<T> | ImportableModule<T>, options: ApplicationOptions = {}): Promise<GlandApplication> {
    const logger = new Logger({ context: 'Gland' });
    const debug = options.debug ?? GlandFactory.debugMode;

    const app = new GlandBroker();
    const initial = new ApplicationInitial(app.broker, logger, debug, options.processHooks);

    // Let the broker replay the bound routes to adapters attaching later.
    initial.onBound = (binder) => app.attachBinder(binder);

    // Awaited. Returning before binding finished meant an application could
    // begin listening before its routes were registered.
    await initial.initialize(root);

    return {
      app,
      shutdown: (signal?: string) => initial.shutdown(signal),
    };
  }
}
