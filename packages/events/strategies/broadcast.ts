import { EventStrategy } from '../interface';
import { Event, Listener } from '../types';

export class BroadcastStrategy implements EventStrategy {
  async execute<E extends Event>(event: E, listeners: Listener<E>[]): Promise<void> {
    await Promise.all(listeners.map((listener) => listener(event)));
  }
}
