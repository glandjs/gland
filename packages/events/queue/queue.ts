import { CircularDeque } from './circular-deque';

export class EventQueue {
  private readonly deque: CircularDeque<string>;
  constructor(maxSize = 1024) {
    this.deque = new CircularDeque<string>(maxSize);
  }

  enqueue(event: string): void {
    this.deque.addFirst(event);
  }

  async process(callback: (event: string) => Promise<void>): Promise<void> {
    while (!this.deque.isEmpty()) {
      const event = this.deque.removeLast();
      if (event) {
        await callback(event);
      }
    }
  }

  clear(): void {
    this.deque.clear();
  }
}
