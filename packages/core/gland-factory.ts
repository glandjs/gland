import { HttpCore } from '@glandjs/http';
import { Broker } from '@glandjs/events';
import { Logger, type Constructor } from '@medishn/toolkit';
import { AppInitial } from './application';
import type { HttpApplicationOptions } from '@glandjs/http/interface';

export class GlandFactory {
  private static readonly logger = new Logger({
    context: 'Gland',
  });
  private broker = new Broker('core');
  static async create(root: Constructor, options?: HttpApplicationOptions): Promise<HttpCore> {
    try {
      const instance = new GlandFactory();
      const initial = new AppInitial(instance.broker);
      const http = new HttpCore(options);
      const httpBroker = http.broker;
      const broker = instance.broker;
      broker.connectTo(httpBroker);
      broker.pipeTo('http', 'http:router:register', 'http:router:register');
      initial.initialize(root);

      return http;
    } catch (error) {
      this.logger.error('Application initialization failed', error);
      process.exit(1);
    }
  }
}
