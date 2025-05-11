import type { Constructor } from '@medishn/toolkit';
import type { TGlandBroker } from '../types';
import { EventRecord } from '@glandjs/events';
export abstract class BrokerAdapter<TEvents extends EventRecord, TApp, TOptions> {
  public broker: TEvents & TGlandBroker;
  public instance: TApp;
  public abstract initialize(): TApp;
  constructor(protected readonly options?: TOptions) {}
}
export type BrokerAdapterClass<TEvents extends EventRecord, TApp, TOptions> = Constructor<BrokerAdapter<TEvents, TApp, TOptions>>;
