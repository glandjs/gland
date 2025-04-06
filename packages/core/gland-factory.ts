import { type Constructor } from '@medishn/toolkit';
import { AppInitial } from './application';
import { GlandBroker } from './gland-broker';

export class GlandFactory {
  private gland = new GlandBroker();
  static async create(root: Constructor): Promise<GlandBroker> {
    const instance = new GlandFactory();
    const broker = instance.gland.broker;
    const initial = new AppInitial(broker);
    initial.initialize(root);
    return instance.gland;
  }
}
