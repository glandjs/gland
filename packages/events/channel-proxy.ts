import { Broker } from './broker';
import { Callback, isString, Noop } from '@medishn/toolkit';
import type { EventChannel, EventOptions, EventType } from './interface';
export class ChannelProxy implements EventChannel {
  constructor(
    private readonly broker: Broker,
    private readonly type: string,
  ) {}

  get name() {
    return this.broker.name;
  }

  private resolveEventName(type?: EventType): string {
    return type ? `${this.type}:${type}` : this.type;
  }

  respond<T, R>(listener: (data: T, respond: (result: R) => void) => void): Noop;
  respond<T, R>(type: EventType, listener: (data: T, respond: (result: R) => void) => void): Noop;
  respond(type: unknown, listener?: any): Noop {
    const event = isString(type) ? this.resolveEventName(type) : this.type;
    return this.broker.respond(event, listener);
  }

  call<R>(type: EventType, data: any, strategy?: 'first' | 'last'): R | undefined;
  call<R>(type: EventType, data: any, strategy?: 'all'): R[];
  call<R>(type: unknown, data: unknown, strategy?: any): R | R[] | undefined {
    const event = isString(type) ? this.resolveEventName(type) : this.type;
    return this.broker.call(event, data, strategy);
  }

  channel(type: EventType): EventChannel {
    return this.broker.channel(`${this.type}:${type}`);
  }

  emit<T>(type: EventType, data: T, options?: EventOptions): void;
  emit<T>(data: T, options?: EventOptions): void;
  emit(type: unknown, data?: unknown, options?: EventOptions): void {
    const event = isString(type) ? this.resolveEventName(type) : this.type;
    return this.broker.emit(event, data, options);
  }

  on<T extends unknown = any>(listener: Callback<[T]>, options?: EventOptions): Noop;
  on<T extends unknown = any>(event: EventType, listener: Callback<[T]>, options: EventOptions): Noop;
  on(...args: any[]): Noop {
    const [fisrt, second, three] = args;
    const eventType = isString(fisrt) ? this.resolveEventName(fisrt) : this.type;
    return this.broker.on(eventType, second ?? fisrt, three);
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

  off<T extends any[] = any>(listener: Callback<T>): void;
  off<T extends any[] = any>(event: EventType, listener: Callback<T>): void;
  off(...args: any): void {
    const [fisrt, second] = args;
    const eventType = isString(fisrt) ? this.resolveEventName(fisrt) : this.type;
    this.broker.off(eventType, second ?? fisrt);
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
