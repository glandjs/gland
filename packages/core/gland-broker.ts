import { Broker } from '@glandjs/events';
import type { BrokerAdapterClass } from './adapter';

/**
 * GlandBroker acts as the root broker and connects adapters to the core system
 */
export class GlandBroker {
  public readonly broker: Broker;

  constructor() {
    this.broker = new Broker('core');
  }

  connectTo<TApp, TOptions>(AdapterClass: BrokerAdapterClass<TApp, TOptions>, options?: TOptions): TApp {
    const adapter = new AdapterClass(options);
    const broker = adapter.broker;

    broker.connectTo(this.broker);

    this.broker.pipeTo(broker.id, 'gland:router:register', 'gland:router:register');

    return adapter.initialize();
  }
}
