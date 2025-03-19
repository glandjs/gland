import { Callback, Noop } from '@medishn/toolkit';
import { EventChannel, EventType } from '@gland/common';
import { EventNode, ChannelProxy } from './core';
export type RequestStrategy = 'first' | 'last' | 'all';

export class EventBroker {
  private static _instance: EventBroker | null = null;

  private readonly _nodes: EventNode;
  private readonly _channels = new Map<string, EventChannel>();
  constructor() {
    this._nodes = new EventNode();
  }

  public static get instance(): EventBroker {
    if (!EventBroker._instance) {
      EventBroker._instance = new EventBroker();
    }
    return EventBroker._instance;
  }
  public request<R>(type: EventType, data: any, strategy?: 'first' | 'last'): R | undefined;
  public request<R>(type: EventType, data: any, strategy?: 'all'): R[];
  public request<R>(type: EventType, data: any, strategy: RequestStrategy = 'first'): R | R[] | undefined {
    const listeners = this.getListeners<any>(type);
    if (!listeners || listeners.length === 0) {
      throw new Error(`No listeners registered for event ${type}`);
    }

    const results: R[] = [];

    for (const listener of listeners) {
      let result: R | undefined;
      result = listener(data)!;

      if (result !== undefined) {
        results.push(result);
      }
    }

    if (strategy === 'first') {
      return results[0];
    } else if (strategy === 'last') {
      return results[results.length - 1];
    }

    return results;
  }

  public respond<T, R>(type: EventType, listener: (data: T) => R): Noop {
    return this.on(type, listener);
  }

  public channel(type: EventType): EventChannel {
    if (!this._channels.has(type)) {
      this._channels.set(type, new ChannelProxy(this, type));
    }
    return this._channels.get(type)!;
  }

  public emit<D>(event: EventType, data: D): void {
    this._nodes.emit(event, data);
  }

  public on<T extends any[] = any>(event: EventType, listener: Callback<T>): Noop {
    this._nodes.on(event, listener);
    const unsubscribe = () => {
      this._nodes.off(event, listener);
    };
    return unsubscribe;
  }
  public off(event: string, listener: Callback): boolean {
    return this._nodes.off(event, listener);
  }

  public pipe(sourceEvent: EventType, targetEvent: EventType): Noop {
    return this.on(sourceEvent, (data) => {
      this.emit(targetEvent, data);
    });
  }
  public forward(broker: EventBroker, event: EventType): Noop {
    return this.on(event, (data) => {
      broker.emit(event, data);
    });
  }

  public once<T extends any[] = any>(event: EventType, listener: Callback<T>): void {
    this._nodes.once(event, listener);
  }

  public broadcast<D>(event: EventType, data?: D): void {
    const events = this._nodes.getEventsByPrefix(event);
    events.forEach((e) => this.emit(e, data));
  }

  public getListeners<T>(event: string): T[] {
    return this._nodes.getListeners(event) as T[];
  }
}
