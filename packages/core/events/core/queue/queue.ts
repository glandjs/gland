import { Event } from '@gland/common';
import { CircularDeque, nextPowerOfTwo } from './circular-deque';

export class EventQueue {
  private readonly maxSize: number;
  private readonly eventMap = new Map<number, Event>();
  private readonly deque: CircularDeque<number>;
  private processingFlag = 0;
  private nextEventId = 1;

  constructor(maxSize = 1000) {
    this.maxSize = nextPowerOfTwo(maxSize);
    this.deque = new CircularDeque<number>(this.maxSize);
  }

  get size(): number {
    return this.deque.size;
  }

  isEmpty(): boolean {
    return this.deque.isEmpty();
  }

  enqueue(event: Event): void {
    const eventId = this.nextEventId++;
    this.deque.addFirst(eventId);
    this.eventMap.set(eventId, { ...event });

    if (this.deque.size > this.maxSize) {
      this.evictExcessEvents();
    }
  }

  dequeue(): Event | undefined {
    const eventId = this.deque.removeLast();
    if (eventId === undefined) return undefined;

    const event = this.eventMap.get(eventId);
    this.eventMap.delete(eventId);
    return event;
  }

  async process(callback: (event: Event) => Promise<void>): Promise<void> {
    if (this.processingFlag) return;
    this.processingFlag = 1;

    let batchSize = 128;
    let processed = 0;

    while (!this.deque.isEmpty()) {
      const batch: Promise<void>[] = [];
      const start = performance.now();

      while (batch.length < batchSize && !this.deque.isEmpty()) {
        const eventId = this.deque.removeLast()!;
        const event = this.eventMap.get(eventId)!;
        batch.push(
          callback(event).catch((err) => {
            console.error(`Event processing failed [${eventId}]:`, err);
          }),
        );
        this.eventMap.delete(eventId);
        processed++;
      }

      await Promise.all(batch);

      const duration = performance.now() - start;
      batchSize = Math.min(1024, Math.max(64, Math.round(batchSize * (16 / duration))));
    }
  }

  private evictExcessEvents(): void {
    let excess = this.deque.size - this.maxSize;
    while (excess-- > 0) {
      const evictedId = this.deque.removeLast();
      if (evictedId !== undefined) {
        this.eventMap.delete(evictedId);
      }
    }
  }
  clear(): void {
    this.deque.clear();

    this.eventMap.clear();

    this.nextEventId = 1;

    this.processingFlag = 0;
  }
}
