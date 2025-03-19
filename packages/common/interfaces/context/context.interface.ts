import { Dictionary } from '@medishn/toolkit';
import { EventType, ProtocolType } from '../../types';

export interface AdapterContext<T extends ProtocolType = ProtocolType> {
  readonly mode: T;
  get error(): unknown;
  set error(err: unknown);
  set state(data: Dictionary<any>);
  get state(): Dictionary<any>;
  emit<D>(event: EventType, data?: D): any;
}
