import type { Broker, CallMethod, EmitMethod, EventOptions, EventPayload, EventRecord, EventReturn, Events, EventType, Listener, OffMethod, OnceMethod, OnMethod } from '@glandjs/events';
import { Dictionary } from '@medishn/toolkit';

export class Context<TEvents extends EventRecord> implements CallMethod<TEvents>, OnMethod<TEvents>, EmitMethod<TEvents>, OnceMethod<TEvents>, OffMethod<TEvents> {
  private _state: Dictionary<any> = {};
  public error?: any;
  constructor(protected broker: Broker<TEvents>) {}
  get state() {
    return this._state;
  }

  set state(data: Dictionary<any>) {
    this._state = Object.assign(this._state, data);
  }

  public emit<K extends Events<TEvents>>(event: K, payload: EventPayload<TEvents, K>, options?: EventOptions): this {
    const channels = this.state?.channel || [{}];

    const brokerId = this.state?.brokerId;
    const listener = event?.includes(':') ? event?.split(/:(.+)/) : event;
    for (const channel of channels) {
      if (channel.event === listener[1]) {
        this.broker.emitTo(brokerId, channel.fullEvent, payload, options);
        return this;
      }
    }
    return this;
  }
  public on<K extends Events<TEvents>>(event: K, listener: Listener<EventPayload<TEvents, K>, void>, options?: EventOptions): this;
  public on<K extends Events<TEvents>>(event: K, listener: null | Listener<EventPayload<TEvents, K>, void>, options: EventOptions & { watch: true }): Promise<EventPayload<TEvents, K>>;
  public on<K extends Events<TEvents>>(event: K, listener: Listener<EventPayload<TEvents, K>, void> | null, options?: EventOptions & { watch?: boolean }): this | Promise<EventPayload<TEvents, K>> {
    // @ts-ignore
    const result = this.broker.on(event, listener, options);
    if (result instanceof Promise) {
      return result;
    }
    return this;
  }
  public off<K extends Events<TEvents>>(event: K, listener?: Listener<EventPayload<TEvents, K>, void>): this {
    this.broker.off(event, listener);
    return this;
  }

  public once<K extends Events<TEvents>>(event: K, listener: Listener<EventPayload<TEvents, K>, void>): this;
  public once<K extends Events<TEvents>>(event: K, listener: Listener<EventPayload<TEvents, K>, void> | null, options: EventOptions & { watch: true }): Promise<EventPayload<TEvents, K>>;
  public once<K extends Events<TEvents>>(event: K, listener: Listener<EventPayload<TEvents, K>, void> | null, options?: EventOptions & { watch?: boolean }): this | Promise<EventPayload<TEvents, K>> {
    // @ts-ignore
    const result = this.broker.once(event, listener, options);
    if (result instanceof Promise) {
      return result;
    }
    return this;
  }
  public call<K extends Events<TEvents>>(event: K, data: EventPayload<TEvents, K>): EventReturn<TEvents, K>;
  public call<K extends Events<TEvents>>(event: K, data: EventPayload<TEvents, K>, strategy: 'all'): EventReturn<TEvents, K>[];

  public call<K extends Events<TEvents>>(event: K, data: EventPayload<TEvents, K>, strategy?: 'all') {
    const channels = this.state?.channel || [{}];
    const brokerId = this.state?.brokerId;
    const listener = event?.includes(':') ? event?.split(/:(.+)/) : event;
    for (const channel of channels) {
      if (channel.event === listener[1]) {
        return this.broker.callTo(brokerId, channel.fullEvent, data, strategy!);
      }
    }
  }
}
