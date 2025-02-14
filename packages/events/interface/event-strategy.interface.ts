import { Event, Listener } from '../types';

export interface EventStrategy {
  execute<E extends Event>(event: E, listeners: Listener<E>[]): Promise<void>;
}
