import { Event } from '@gland/common';
import { CircularDeque } from './circular-deque';
export class EventQueue {
  private readonly maxSize: number;

  private readonly eventMap: Map<string, Event>;
  private readonly deque: CircularDeque<Event>;
  private processingInProgress: boolean = false;

  constructor() {
    this.maxSize = 1000;
    this.eventMap = new Map<string, Event>();
    this.deque = new CircularDeque<Event>(this.maxSize);
  }

  get size(): number {
    return this.deque.size;
  }

  public isEmpty(): boolean {
    return this.deque.size === 0;
  }

  enqueue(event: Event): void {
    const key = this.getEventKey(event);

    const existingEvent = this.eventMap.get(key);
    if (existingEvent) {
      this.deque.remove(existingEvent);
      this.eventMap.delete(key);
    }

    this.deque.addFirst(event);
    this.eventMap.set(key, event);

    this.enforceMaxSize();
  }

  dequeue(): Event | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const event = this.deque.removeLast();
    if (event) {
      this.eventMap.delete(this.getEventKey(event));
    }
    return event;
  }

  async process(callback: (event: Event) => void | Promise<void>): Promise<void> {
    if (this.processingInProgress) {
      return;
    }

    try {
      this.processingInProgress = true;

      const events = this.deque.toArray();
      const batchSize = 100;

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await Promise.all(
          batch.map((event) => {
            try {
              return Promise.resolve(callback(event));
            } catch (err) {
              console.error('Error processing event:', err);
              return Promise.resolve();
            }
          }),
        );
      }
    } finally {
      this.clear();
      this.processingInProgress = false;
    }
  }

  clear(): void {
    this.eventMap.clear();
    this.deque.clear();
  }
  private enforceMaxSize(): void {
    const excessCount = this.deque.size - this.maxSize;

    if (excessCount <= 0) {
      return;
    }

    for (let i = 0; i < excessCount; i++) {
      const removed = this.deque.removeLast();
      if (removed) {
        this.eventMap.delete(this.getEventKey(removed));
      }
    }
  }

  private getEventKey(event: Event): string {
    return `${event.type}:${event.correlationId}`;
  }
}
