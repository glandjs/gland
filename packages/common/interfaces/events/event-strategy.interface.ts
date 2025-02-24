import { Event, Listener } from '../../types/events';

export interface EventStrategy {
  execute<E extends Event>(event: E, listeners: Listener<E>[]): any;
}
