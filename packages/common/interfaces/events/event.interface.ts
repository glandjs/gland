import { EventType } from '../../types';
import { Callback, Noop } from '@medishn/toolkit';

export interface EventChannel {
  channel(type: EventType): EventChannel;

  request<R>(type: EventType, data: any, strategy?: 'first' | 'last'): R | undefined;
  request<R>(type: EventType, data: any, strategy?: 'all'): R[];

  respond<T, R>(listener: (data: T, respond: (result: R) => void) => void): Noop;
  respond<T, R>(type: EventType, listener: (data: T, respond: (result: R) => void) => void): Noop;

  emit<T>(type: EventType, data: T): void;
  emit<T>(data: T): void;

  on<T extends any = any>(listener: Callback<[T]>): Noop;
  on<T extends any = any>(event: EventType, listener: Callback<[T]>): Noop;

  once<T extends any = any>(listener: Callback<[T]>): void;
  once<T extends any = any>(event: EventType, listener: Callback<[T]>): void;

  broadcast<T extends string, D>(data?: D): void;
  broadcast<T extends string, D>(type: EventType, data?: D): void;

  off<T extends any = any>(listener: Callback<[T]>): boolean;
  off<T extends any = any>(event: EventType, listener: Callback<[T]>): boolean;

  getListeners<T>(event: EventType): T[];
  getListeners<T>(): T[];
}
