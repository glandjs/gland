import { Constructor, Logger } from '@medishn/toolkit';
import { DependenciesScanner, Explorer } from '../injector';
import type { TGlandBroker } from '../types';
import { ApplicationBinder } from './application-binder';
import { ApplicationLifecycle } from './application-lifecycle';

export class ApplicationInitial {
  private readonly dependenciesScanner: DependenciesScanner;
  private lifecycle: ApplicationLifecycle;

  constructor(
    private broker: TGlandBroker,
    private logger: Logger,
    private mode: boolean,
  ) {
    this.dependenciesScanner = new DependenciesScanner(this.getLogger());
  }
  getLogger(): Logger | undefined {
    return this.mode ? this.logger : undefined;
  }
  public async initialize(root: Constructor): Promise<void> {
    const logger = this.logger.child('Initial');
    try {
      logger.info('Scanning module dependencies');
      await this.dependenciesScanner.scan(root);

      logger.info('Initializing dependency injector');
      const explorer = new Explorer(this.dependenciesScanner.modules, this.getLogger());

      this.lifecycle = new ApplicationLifecycle(this.dependenciesScanner.modules, this.getLogger());

      this.logger.info('Running module initialization hooks');
      await this.lifecycle.init();

      logger.info('Binding application components');
      const appBinder = new ApplicationBinder(explorer, this.broker, this.getLogger());
      appBinder.bind();

      this.logger.info('Running channel initialization hooks');
      await this.lifecycle.initChannels();

      this.logger.info('Bootstrapping application');
      await this.lifecycle.bootstrap();

      this.logger.info('Application initialized successfully');
    } catch (error) {
      logger.error(`Application initialization failed: ${error.message}`);
      throw error;
    }
  }
  public async shutdown(signal?: string): Promise<void> {
    if (this.lifecycle) {
      await this.lifecycle.shutdown(signal);
    }
  }
}
