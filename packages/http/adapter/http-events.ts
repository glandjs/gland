import { EventChannel, EventType } from '@gland/common';
import { Callback, Noop } from '@medishn/toolkit';
export class HttpEventCore implements EventChannel {
  constructor(private readonly _channel: EventChannel) {}

  respond<T, R>(listener: (data: T, respond: (result: R) => void) => void): Noop;
  respond<T, R>(type: EventType, listener: (data: T, respond: (result: R) => void) => void): Noop;
  respond(...args: any[]): Noop {
    return this._channel.respond(...(args as [EventType, any]));
  }

  request<R>(type: EventType, data: any, strategy?: 'first' | 'last'): R | undefined;
  request<R>(type: EventType, data: any, strategy?: 'all'): R[];
  request<R>(type: any, data: any, strategy?: any): R | R[] | undefined {
    return this._channel.request(type, data, strategy);
  }

  channel(type: EventType): HttpEventCore {
    return new HttpEventCore(this._channel.channel(type));
  }

  emit<T>(type: EventType, data: T): void;
  emit<T>(data: T): void;
  emit(...args: any[]): void {
    this._channel.emit(...(args as [EventType, any]));
  }

  getListeners<T>(event: EventType): T[];
  getListeners<T>(): T[];
  getListeners(...args: any[]): Callback<any>[] {
    return this._channel.getListeners(...(args as [EventType]));
  }

  off<T extends any[] = any>(listener: Callback<T>): boolean;
  off<T extends any[] = any>(event: EventType, listener: Callback<T>): boolean;
  off(...args: any[]): boolean {
    return this._channel.off(...(args as [EventType, any]));
  }

  on<T extends any = any>(listener: Callback<[T]>): Noop;
  on<T extends any = any>(event: EventType, listener: Callback<[T]>): Noop;
  on(...args: any[]): Noop {
    return this._channel.on(...(args as [EventType, any]));
  }
  once<T extends any = any>(listener: Callback<[T]>): void;
  once<T extends any = any>(event: EventType, listener: Callback<[T]>): void;
  once(...args: any[]): void {
    return this._channel.once(...(args as [EventType, any]));
  }

  broadcast<T extends string, D>(data?: D): void;
  broadcast<T extends string, D>(type: EventType, data?: D): void;
  broadcast(...args: any[]): void {
    return this._channel.broadcast(...(args as [EventType]));
  }

  safeEmit<T>(type: EventType, data: T): boolean {
    this.emit(type, data);

    const listeners = this.getListeners(type);

    if (listeners.length === 0) {
      this.off(type, () => {});
      return false;
    }
    return true;
  }
}
