import { EventStrategy } from '../interface';
import { Event, Listener } from '../types';

export class ImmediateStrategy implements EventStrategy {
  async execute<T extends Event>(event: T, listeners: Listener<T>[]): Promise<void> {
    for (const listener of listeners) {
      await listener(event);
    }
  }
}
