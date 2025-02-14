import { EventStrategy } from '../interface';
import { Event, Listener } from '../types';

export class QueueStrategy implements EventStrategy {
  private queue: Promise<void> = Promise.resolve();

  async execute<E extends Event>(event: E, listeners: Listener<E>[]): Promise<void> {
    for (const listener of listeners) {
      this.queue = this.queue.then(() => listener(event));
    }
    await this.queue;
  }
}
