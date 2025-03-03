import { Listener } from '@gland/common/types';

export interface EventChannel<D, R> {
  emit<T>(data: T): void;
  on<R>(listener: Listener<R>): any;
}
