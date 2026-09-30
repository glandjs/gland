import type { Logger } from '@medishn/toolkit';
import type { ModulesContainer } from '../injector';
import { LifecycleScanner } from '../hooks/lifecycle.scanner';
import { ProcessHooks, type ProcessHookOptions } from '../hooks/process-hooks';

/**
 * Drives the ordered lifecycle phases and owns process-level shutdown.
 *
 * Phase order is fixed and matches the framework's contract:
 * `init -> bind -> initChannels -> bootstrap`, and on the way down
 * `onAppShutdown -> onModuleDestroy`.
 *
 * @example
 * ```ts
 * const lifecycle = new ApplicationLifecycle(modules, logger);
 * await lifecycle.init();
 * ```
 */
export class ApplicationLifecycle {
  private readonly lifecycleScanner: LifecycleScanner;
  private readonly processHooks?: ProcessHooks;
  private readonly logger?: Logger;
  private isBootstrapped = false;
  private isShuttingDown = false;

  constructor(modulesContainer: ModulesContainer, logger?: Logger, processHookOptions?: ProcessHookOptions) {
    this.logger = logger?.child('ApplicationLifecycle');
    this.lifecycleScanner = new LifecycleScanner(modulesContainer, logger);

    // No handlers when no logger is available: reporting errors requires a
    // destination, and silently swallowing them would be worse than not
    // installing the hook at all.
    if (logger) {
      this.processHooks = new ProcessHooks(logger, processHookOptions);
      this.processHooks.install((signal) => this.shutdown(signal));
    }
  }

  /** Phase 1 — scan for hooks and run `onModuleInit`. */
  public async init(): Promise<void> {
    this.logger?.info('Initializing modules');
    this.lifecycleScanner.scanForHooks();
    await this.lifecycleScanner.onModuleInit();
    this.logger?.info('Modules initialized');
  }

  /** Phase 3 — run `onChannelInit`, after channels are bound. */
  public async initChannels(): Promise<void> {
    this.logger?.info('Initializing channels');
    await this.lifecycleScanner.onChannelInit();
    this.logger?.info('Channels initialized');
  }

  /** Phase 4 — run `onAppBootstrap`. Safe to call more than once. */
  public async bootstrap(): Promise<void> {
    if (this.isBootstrapped) return;
    this.logger?.info('Bootstrapping application');
    await this.lifecycleScanner.onAppBootstrap();
    this.isBootstrapped = true;
    this.logger?.info('Application bootstrapped');
  }

  /**
   * Runs `onAppShutdown` then `onModuleDestroy`, then unregisters the process
   * handlers.
   *
   * Idempotent, and never rethrows: shutdown runs on a signal path, where an
   * escaping error would skip the remaining hooks.
   *
   * @param signal - the signal that triggered shutdown, if any
   */
  public async shutdown(signal?: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.logger?.info(`Shutting down${signal ? ` (signal: ${signal})` : ''}`);
    try {
      await this.lifecycleScanner.onAppShutdown(signal);
      await this.lifecycleScanner.onModuleDestroy();
      this.logger?.info('Shutdown complete');
    } catch (error) {
      this.logger?.error(`Error during shutdown: ${(error as Error)?.message ?? error}`);
    } finally {
      this.processHooks?.dispose();
    }
  }
}
