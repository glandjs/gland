import { EventIdentifier } from '@gland/common/types';
import { Callback, Noop } from '@medishn/toolkit';
export interface EventChannel {
  channel(type: EventIdentifier): EventChannel;
  request<R>(data: any): R;
  request<R>(type: EventIdentifier<string>, data: any): R;

  responed<T, R>(listener: (data: T, respond: (result: R) => void) => void): Noop;
  responed<T, R>(type: EventIdentifier<string>, listener: (data: T, respond: (result: R) => void) => void): Noop;

  emit<T>(type: EventIdentifier, data: T): void;
  emit<T>(data: T): void;
  on<T extends any = any>(listener: Callback<[T]>): Noop;
  on<T extends any = any>(event: EventIdentifier<string>, listener: Callback<[T]>): Noop;
  off<T extends any = any>(listener: Callback<[T]>): void;
  off<T extends any = any>(event: EventIdentifier<string>, listener: Callback<[T]>): void;
  getListeners<T>(event: EventIdentifier<string>): T[];
  getListeners<T>(): T[];
}
