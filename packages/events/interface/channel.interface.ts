import { Callback, Noop } from '@medishn/toolkit';
export interface EventOptions {
  queue?: boolean;
}
export type EventType = string;
export interface EventChannel {
  channel(type: EventType): EventChannel;

  name: string;

  call<R>(type: EventType, data: any, strategy?: 'first' | 'last'): R | undefined;
  call<R>(type: EventType, data: any, strategy?: 'all'): R[];

  respond<T, R>(listener: (data: T, respond: (result: R) => void) => void): Noop;
  respond<T, R>(type: EventType, listener: (data: T, respond: (result: R) => void) => void): Noop;

  emit<T>(type: EventType, data: T, options?: EventOptions): void;
  emit<T>(data: T, options?: EventOptions): void;

  on<T extends any = any>(listener: Callback<[T]>, options?: EventOptions): Noop;
  on<T extends any = any>(event: EventType, listener: Callback<[T]>, options?: EventOptions): Noop;

  once<T extends any = any>(listener: Callback<[T]>): void;
  once<T extends any = any>(event: EventType, listener: Callback<[T]>): void;

  broadcast<T extends string, D>(data?: D): void;
  broadcast<T extends string, D>(type: EventType, data?: D): void;

  off<T extends any = any>(listener: Callback<[T]>): void;
  off<T extends any = any>(event: EventType, listener: Callback<[T]>): void;

  getListeners<T>(event: EventType): T[];
  getListeners<T>(): T[];
}
