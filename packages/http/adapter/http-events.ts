import { EventChannel, EventIdentifier } from '@gland/common';
import { Callback, Noop } from '@medishn/toolkit';
export class HttpEventCore implements EventChannel {
  constructor(private readonly _channel: EventChannel) {}

  respond<T, R>(listener: (data: T, respond: (result: R) => void) => void): Noop;
  respond<T, R>(type: EventIdentifier<string>, listener: (data: T, respond: (result: R) => void) => void): Noop;
  respond(...args: any[]): Noop {
    return this._channel.respond(...(args as [EventIdentifier<string>, any]));
  }

  request<R>(type: EventIdentifier<string>, data: any, strategy?: 'first' | 'last'): R | undefined;
  request<R>(type: EventIdentifier<string>, data: any, strategy?: 'all'): R[];
  request<R>(type: any, data: any, strategy?: any): R | R[] | undefined {
    return this._channel.request(type, data, strategy);
  }

  channel(type: EventIdentifier): HttpEventCore {
    return new HttpEventCore(this._channel.channel(type));
  }

  emit<T>(type: EventIdentifier, data: T): void;
  emit<T>(data: T): void;
  emit(...args: any[]): void {
    this._channel.emit(...(args as [EventIdentifier<string>, any]));
  }

  getListeners<T>(event: EventIdentifier<string>): T[];
  getListeners<T>(): T[];
  getListeners(...args: any[]): Callback<any>[] {
    return this._channel.getListeners(...(args as [EventIdentifier]));
  }

  off<T extends any[] = any>(listener: Callback<T>): void;
  off<T extends any[] = any>(event: EventIdentifier<string>, listener: Callback<T>): void;
  off(...args: any[]): void {
    this._channel.off(...(args as [EventIdentifier<string>, any]));
  }

  on<T extends any = any>(listener: Callback<[T]>): Noop;
  on<T extends any = any>(event: EventIdentifier<string>, listener: Callback<[T]>): Noop;
  on(...args: any[]): Noop {
    return this._channel.on(...(args as [EventIdentifier<string>, any]));
  }
  once<T extends any = any>(listener: Callback<[T]>): Noop;
  once<T extends any = any>(event: EventIdentifier<string>, listener: Callback<[T]>): Noop;
  once(...args: any[]): Noop {
    return this._channel.once(...(args as [EventIdentifier<string>, any]));
  }

  drain(): Promise<void> {
    return this._channel.drain();
  }
  broadcast<T extends string, D>(data?: D): void;
  broadcast<T extends string, D>(type: EventIdentifier<T>, data?: D): void;
  broadcast(...args: any[]): void {
    return this._channel.broadcast(...(args as [EventIdentifier]));
  }

  safeEmit<T>(type: EventIdentifier<string>, data: T): boolean {
    this.emit(type, data);

    const listeners = this.getListeners(type);

    if (listeners.length === 0) {
      this.off(type, () => {});
      return false;
    }
    return true;
  }
}
