import type { Logger } from '@medishn/toolkit';

/**
 * Process-level lifecycle handling: signal handling and error reporting.
 *
 * Extracted from `ApplicationLifecycle` because the two concerns have
 * opposite failure policies. Signals mean "shutting down", so the process
 * should exit. An uncaught exception or unhandled rejection does not — it is a
 * bug in application code, and tearing the process down is a decision the
 * application should make, not the framework.
 */
export interface ProcessHookOptions {
  /**
   * Signals that trigger a graceful shutdown.
   *
   * @defaultValue `['SIGTERM', 'SIGINT', 'SIGHUP']`
   */
  signals?: readonly string[];

  /**
   * Call `process.exit(0)` once a shutdown signal has been handled.
   *
   * Set to `false` to run the shutdown hooks and keep the process alive, e.g.
   * in a test runner or a server embedded in a larger process.
   *
   * @defaultValue `true`
   */
  exitOnSignal?: boolean;

  /**
   * Log uncaught exceptions and unhandled rejections.
   *
   * Reporting only — the process is never terminated on account of them.
   *
   * @defaultValue `true`
   */
  reportErrors?: boolean;
}

/**
 * Installs process event handlers and removes them again.
 *
 * The previous implementation registered `process.on('unhandledRejection')`
 * with a `process.exit(1)` inside, from a constructor. That made any stray
 * rejection a fatal, process-killing event, and re-registered a full set of
 * listeners on every `GlandFactory.create()` call — so listener count grew
 * without bound in tests and under hot reload.
 *
 * Handlers are now registered exactly once, tracked by this instance, and
 * removed by {@link ProcessHooks.dispose}.
 *
 * @example
 * ```ts
 * const hooks = new ProcessHooks(logger);
 * await hooks.dispose(); // unregisters everything
 * ```
 */
export class ProcessHooks {
  private readonly logger?: Logger;
  private readonly options: Required<Pick<ProcessHookOptions, 'signals' | 'exitOnSignal' | 'reportErrors'>>;
  private installed: Array<[NodeJS.Signals | string, (...args: any[]) => void]> = [];

  /**
   * @param logger - receives error reports
   * @param options - which signals to handle and whether to exit
   */
  constructor(logger?: Logger, options: ProcessHookOptions = {}) {
    this.logger = logger?.child('Process');
    this.options = {
      signals: options.signals ?? ['SIGTERM', 'SIGINT', 'SIGHUP'],
      exitOnSignal: options.exitOnSignal ?? true,
      reportErrors: options.reportErrors ?? true,
    };
  }

  /**
   * Registers the configured handlers.
   *
   * Idempotent — calling it twice does not double-register.
   *
   * @param onShutdown - invoked with the signal name when a signal arrives
   */
  public install(onShutdown: (signal: string) => Promise<void> | void): void {
    if (this.installed.length) return;
    if (typeof process === 'undefined' || !process?.on) return;

    for (const signal of this.options.signals) {
      const handler = () => {
        void (async () => {
          try {
            await onShutdown(signal);
          } catch (error) {
            this.logger?.error(`Shutdown after "${signal}" failed: ${(error as Error)?.message ?? error}`);
          } finally {
            if (this.options.exitOnSignal) process.exit(0);
          }
        })();
      };
      process.on(signal, handler);
      this.installed.push([signal, handler]);
    }

    if (this.options.reportErrors) {
      const onUncaught = (error: Error) => {
        this.logger?.error(`Uncaught exception: ${error?.message ?? error}`);
        if (error?.stack) this.logger?.error(error.stack);
      };
      const onRejection = (reason: unknown) => {
        this.logger?.error(`Unhandled rejection: ${(reason as Error)?.message ?? reason}`);
        if ((reason as Error)?.stack) this.logger?.error((reason as Error).stack);
      };

      process.on('uncaughtException', onUncaught);
      process.on('unhandledRejection', onRejection);
      this.installed.push(['uncaughtException', onUncaught], ['unhandledRejection', onRejection]);
    }

    this.logger?.debug(`Installed ${this.installed.length} process handler(s)`);
  }

  /** Removes every handler this instance registered. */
  public dispose(): void {
    if (typeof process === 'undefined' || !process?.off) return;

    for (const [event, handler] of this.installed) {
      process.off(event, handler);
    }
    this.logger?.debug('Removed process handlers');
    this.installed = [];
  }
}
