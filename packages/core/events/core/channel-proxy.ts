import { EventChannel, EventType } from '@gland/common';
import { EventBroker } from '../broker';
import { Callback, isString, Noop } from '@medishn/toolkit';

export class ChannelProxy implements EventChannel {
  constructor(private readonly broker: EventBroker, private readonly type: string) {}

  private resolveEventName(type?: EventType): string {
    return type ? `${this.type}:${type}` : this.type;
  }

  respond<T, R>(listener: (data: T, respond: (result: R) => void) => void): Noop;
  respond<T, R>(type: EventType, listener: (data: T, respond: (result: R) => void) => void): Noop;
  respond(type: unknown, listener?: any): Noop {
    const event = isString(type) ? this.resolveEventName(type) : this.type;
    return this.broker.respond(event, listener);
  }

  request<R>(type: EventType, data: any, strategy?: 'first' | 'last'): R | undefined;
  request<R>(type: EventType, data: any, strategy?: 'all'): R[];
  request<R>(type: unknown, data: unknown, strategy?: any): R | R[] | undefined {
    const event = isString(type) ? this.resolveEventName(type) : this.type;
    return this.broker.request(event, data, strategy);
  }

  channel(type: EventType): EventChannel {
    return this.broker.channel(`${this.type}:${type}`);
  }

  emit<T>(type: EventType, data: T): void;
  emit<T>(data: T): void;
  emit(type: unknown, data?: unknown): void {
    const event = isString(type) ? this.resolveEventName(type) : this.type;
    return this.broker.emit(event, data);
  }

  on<T extends any = any>(listener: Callback<[T]>): Noop;
  on<T extends any = any>(event: EventType, listener: Callback<[T]>): Noop;
  on(...args: any): Noop {
    const [fisrt, second] = args;
    const eventType = isString(fisrt) ? this.resolveEventName(fisrt) : this.type;
    return this.broker.on(eventType, second ?? fisrt);
  }

  once<T extends any = any>(listener: Callback<[T]>): void;
  once<T extends any = any>(event: EventType, listener: Callback<[T]>): void;
  once(...args: any): void {
    const [fisrt, second] = args;
    const eventType = isString(fisrt) ? this.resolveEventName(fisrt) : this.type;
    this.broker.once(eventType, second ?? fisrt);
  }

  broadcast<T extends string, D>(data?: D): void;
  broadcast<T extends string, D>(type: EventType, data?: D): void;
  broadcast(...args: any): void {
    const [fisrt, second] = args;
    const eventType = isString(fisrt) ? this.resolveEventName(fisrt) : this.type;
    return this.broker.broadcast(eventType, second ?? fisrt);
  }

  off<T extends any[] = any>(listener: Callback<T>): boolean;
  off<T extends any[] = any>(event: EventType, listener: Callback<T>): boolean;
  off(...args: any): boolean {
    const [fisrt, second] = args;
    const eventType = isString(fisrt) ? this.resolveEventName(fisrt) : this.type;
    return this.broker.off(eventType, second ?? fisrt);
  }

  getListeners<T>(event: EventType): T[];
  getListeners<T>(): T[];
  getListeners<T>(event?: unknown): T[] {
    if (event) {
      return this.broker.getListeners(`${this.type}:${event}`);
    } else {
      return this.broker.getListeners(this.type);
    }
  }
}
