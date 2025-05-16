import { EventBroker, EventRecord } from '@glandjs/events';
import type { BrokerAdapterClass } from './adapter';
import type { TGlandBroker } from './types/gland-broker.type';

export class GlandBroker {
  public readonly broker: TGlandBroker;

  constructor() {
    this.broker = new EventBroker({ name: '@glandjs/core' }) as TGlandBroker;
  }

  connectTo<TEvents extends EventRecord, TApp, TOptions>(AdapterClass: BrokerAdapterClass<TEvents, TApp, TOptions>, options?: TOptions): TApp {
    const adapter = new AdapterClass(options);
    const broker = adapter.broker as any;
    broker.connectTo(this.broker);
    return adapter.initialize();
  }
}
