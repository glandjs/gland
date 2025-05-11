import { Logger, type Constructor } from '@medishn/toolkit';
import { ApplicationInitial } from './application';
import { GlandBroker } from './gland-broker';

export class GlandFactory {
  private gland = new GlandBroker();
  private readonly logger = new Logger({
    context: 'Gland',
  });
  get debugMode(): boolean {
    return !!process.env.GLAND_DEBUG;
  }

  static async create(root: Constructor): Promise<GlandBroker> {
    const instance = new GlandFactory();

    const broker = instance.gland.broker;
    const initial = new ApplicationInitial(broker, instance.logger, instance.debugMode);
    initial.initialize(root);
    return instance.gland;
  }
}
