import { Event } from '@gland/common';
import { CircularDeque } from './circular-deque';

export class EventQueue {
  private readonly deque: CircularDeque<Event>;
  private processingFlag = 0;

  constructor(maxSize = 1000) {
    this.deque = new CircularDeque<Event>(maxSize);
  }

  get size(): number {
    return this.deque.size;
  }
  isEmpty(): boolean {
    return this.deque.isEmpty();
  }
  enqueue(event: Event): void {
    this.deque.addFirst(event);

    if (this.deque.isFull()) {
      this.evictExcessEvents();
    }
  }

  async process(callback: (event: Event) => Promise<void>): Promise<void> {
    if (this.processingFlag) return;
    this.processingFlag = 1;

    try {
      let batchSize = 128;
      let processed = 0;

      while (!this.deque.isEmpty()) {
        const batch: Promise<void>[] = [];
        const start = performance.now();

        while (batch.length < batchSize && !this.deque.isEmpty()) {
          const event = this.deque.removeLast();
          if (event) {
            batch.push(
              callback(event).catch((err) => {
                console.error(`Event processing failed:`, err);
              }),
            );
            processed++;
          }
        }

        await Promise.all(batch);

        const duration = performance.now() - start;

        batchSize = Math.min(1024, Math.max(64, Math.round(batchSize * (16 / duration))));
      }
    } finally {
      this.processingFlag = 0;
    }
  }

  private evictExcessEvents(): void {
    while (this.deque.size > this.deque.buffer.length * 0.5) {
      this.deque.removeLast();
    }
  }

  clear(): void {
    this.deque.clear();
    this.processingFlag = 0;
  }
}
