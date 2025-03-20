import { AdapterContext, EventType, ProtocolType } from '@gland/common';
import { Dictionary, merge } from '@medishn/toolkit';
import { EventBroker } from '../events';

export class Context<T extends ProtocolType = ProtocolType> implements AdapterContext<T> {
  private _state: Dictionary<any> = {};
  private _error?: unknown;
  private readonly _eventBroker: EventBroker;

  constructor(public readonly mode: T) {
    this._eventBroker = EventBroker.instance;
  }

  get state(): Dictionary<any> {
    return { ...this._state };
  }

  set state(data: Dictionary<any>) {
    this._state = merge(this._state, data).value;
  }
  get error(): unknown {
    return this._error;
  }

  set error(err: unknown) {
    this._error = err;
  }
  emit<D = any>(event: EventType, data?: D): void {
    this._eventBroker.emit(event, data);
  }
}
