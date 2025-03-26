import { Constructor, Logger } from '@medishn/toolkit';
import type { Broker } from '@gland/events';
import { DependenciesScanner, Explorer, AppBinder } from '../injector';

export class AppInitial {
  private readonly dependenciesScanner: DependenciesScanner;
  private readonly logger = new Logger({
    context: 'Gland:Initial',
  });
  constructor(private broker: Broker) {
    this.dependenciesScanner = new DependenciesScanner();
  }

  public async initialize(root: Constructor): Promise<void> {
    try {
      this.logger.info('Scanning module dependencies');
      await this.dependenciesScanner.scan(root);

      this.logger.info('Initializing dependency injector');
      const explorer = new Explorer(this.dependenciesScanner.modules);

      this.logger.info('Binding application components');
      const appBinder = new AppBinder(explorer, this.broker);
      appBinder.bind();
      this.logger.info('Application initialized successfully');
    } catch (error) {
      this.logger.error(`Application initialization failed: ${error.message}`);
      throw error;
    }
  }
}
