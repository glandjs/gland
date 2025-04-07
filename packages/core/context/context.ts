import type { EventType } from '@glandjs/common';
import type { Broker } from '@glandjs/events';
import { Dictionary, merge } from '@medishn/toolkit';

export class Context {
  private _state: Dictionary<any> = {};
  public error?: any;
  constructor(protected broker: Broker) {}
  get state() {
    return this._state;
  }

  set state(data: Dictionary<any>) {
    this._state = merge(this._state, data).value;
  }

  emit<D>(event: EventType, data?: D): void {
    const isExternal = event.startsWith('@');
    const type = isExternal ? event.split('@')[1] : event;

    if (isExternal) {
      this.broker.emitTo('core', `gland:external:${type}`, data);
      return;
    }

    const channels = this.state.channel;

    for (const channel of channels) {
      if (channel.event === type) {
        this.broker.emitTo('core', channel.fullEvent, data);
      }
    }
  }
}
