import { Logger } from '@medishn/toolkit';
import { ModulesContainer } from '../injector/container/module-container';
import { LifecycleScanner } from '../hooks';

export class ApplicationLifecycle {
  private readonly lifecycleScanner: LifecycleScanner;
  private isBootstrapped = false;
  private isShuttingDown = false;
  private shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGHUP'];
  private readonly logger?: Logger;
  constructor(modulesContainer: ModulesContainer, logger?: Logger) {
    this.logger = logger?.child('ApplicationLifecycle');
    this.lifecycleScanner = new LifecycleScanner(modulesContainer, logger);
    this.setupShutdownHooks();
  }

  private setupShutdownHooks(): void {
    if (typeof process !== 'undefined' && process) {
      for (const signal of this.shutdownSignals) {
        process.on(signal, async () => {
          await this.shutdown(signal);
          process.exit(0);
        });
      }

      process.on('uncaughtException', async (error) => {
        this.logger?.error(`Uncaught exception: ${error.message}`);
        this.logger?.error(error.stack);
        await this.shutdown('uncaughtException');
        process.exit(1);
      });

      process.on('unhandledRejection', async (reason) => {
        this.logger?.error(`Unhandled rejection: ${reason}`);
        await this.shutdown('unhandledRejection');
        process.exit(1);
      });
    }
  }

  public async init(): Promise<void> {
    this.logger?.info('Initializing modules');
    this.lifecycleScanner.scanForHooks();
    await this.lifecycleScanner.onModuleInit();
    this.logger?.info('Modules initialized');
  }
  public async initChannels(): Promise<void> {
    this.logger?.info('Initializing channels');
    await this.lifecycleScanner.onChannelInit();
    this.logger?.info('Channels initialized');
  }

  public async bootstrap(): Promise<void> {
    if (this.isBootstrapped) {
      return;
    }

    this.logger?.info('Bootstrapping application');
    await this.lifecycleScanner.onAppBootstrap();
    this.isBootstrapped = true;
    this.logger?.info('Application bootstrapped successfully');
  }

  public async shutdown(signal?: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.logger?.info(`Shutting down application${signal ? ` (signal: ${signal})` : ''}`);

    try {
      await this.lifecycleScanner.onAppShutdown(signal);
      await this.lifecycleScanner.onModuleDestroy();
      this.logger?.info('Application shutdown complete');
    } catch (error) {
      this.logger?.error(`Error during shutdown: ${error.message}`);
    }
  }
}
