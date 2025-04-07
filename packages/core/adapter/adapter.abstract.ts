import type { Broker } from '@glandjs/events';
import type { Constructor } from '@medishn/toolkit';
export abstract class BrokerAdapter<TApp, TOptions> {
  public abstract readonly broker: Broker;
  public abstract initialize(): TApp;
  constructor(protected readonly options?: TOptions) {}
}
export type BrokerAdapterClass<TApp, TOptions> = Constructor<BrokerAdapter<TApp, TOptions>>;
