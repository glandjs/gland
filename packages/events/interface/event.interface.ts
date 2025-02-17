import { EventContext } from '../core';

export interface EventContextFactory {
  create(): EventContext;
}

export interface EventChannel<D, R> {
  emit<T>(data: T): Promise<void>;
  request(data: D): Promise<R>;
  respond(handler: (data: D) => Promise<R> | R): () => void;
}
