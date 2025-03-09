import { EventChannel, EventIdentifier } from '@gland/common';
import { Callback, Noop } from '@medishn/toolkit';
export class HttpEventCore implements EventChannel {
  constructor(private readonly _channel: EventChannel) {}

  responed<T, R>(listener: (data: T, respond: (result: R) => void) => void): Noop;
  responed<T, R>(type: EventIdentifier<string>, listener: (data: T, respond: (result: R) => void) => void): Noop;
  responed(type: any, listener?: any): Noop {
    if (listener === undefined) {
      return this._channel.responed(type);
    } else {
      return this._channel.responed(type, listener);
    }
  }
  request<R>(data: any): R;
  request<R>(type: EventIdentifier<string>, data: any): R;
  request(type: string, data?: unknown) {
    if (data === undefined) {
      return this._channel.request(type);
    }
    return this._channel.request(type, data);
  }

  channel(type: EventIdentifier): HttpEventCore {
    return new HttpEventCore(this._channel.channel(type));
  }

  emit<T>(type: EventIdentifier, data: T): void;
  emit<T>(data: T): void;
  emit(type: string, data?: unknown): void {
    if (data === undefined) {
      this._channel.emit(type);
    } else {
      this._channel.emit(type, data);
    }
  }

  getListeners<T>(event: EventIdentifier<string>): T[];
  getListeners<T>(): T[];
  getListeners(event?: unknown): Callback<any>[] {
    return this._channel.getListeners(event as EventIdentifier<string>);
  }

  off<T extends any[] = any>(listener: Callback<T>): void;
  off<T extends any[] = any>(event: EventIdentifier<string>, listener: Callback<T>): void;
  off(event: unknown, listener?: unknown): void {
    if (listener === undefined) {
      this._channel.off(event as Callback<any>);
    } else {
      this._channel.off(event as EventIdentifier<string>, listener as Callback<any>);
    }
  }

  on<T extends any = any>(listener: Callback<[T]>): Noop;
  on<T extends any = any>(event: EventIdentifier<string>, listener: Callback<[T]>): Noop;
  on(event: unknown, listener?: unknown): Noop {
    if (listener === undefined) {
      return this._channel.on(event as Callback<any>);
    }
    return this._channel.on(event as EventIdentifier<string>, listener as Callback<any>);
  }
}
