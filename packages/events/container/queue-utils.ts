import { EventQueue } from '../queue';
import type { QueeuType } from './router';

export class QueueUtils {
  constructor(private _queues: QueeuType) {}
  public queueEvent(event: string): void {
    const queue = this._getOrCreateQueue(event);

    queue.enqueue(event);
  }

  private _getOrCreateQueue(type: string): EventQueue {
    if (!this._queues.has(type)) {
      this._queues.set(type, new EventQueue());
    }
    return this._queues.get(type) as EventQueue;
  }
  public cleanup(event: string): void {
    const queue = this._queues.get(event);
    if (queue) {
      queue.clear();
      this._queues.delete(event);
    }
  }
}
