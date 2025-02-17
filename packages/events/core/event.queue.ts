import { EventType } from '@gland/common';
import { Event } from '../types';

interface QueueNode<T extends EventType, D> {
  event: Event<T, D>;
  next?: QueueNode<T, D>;
  prev?: QueueNode<T, D>;
}

export class EventQueue<T extends EventType = EventType, D = unknown> {
  private readonly maxSize: number;
  private readonly map = new Map<string, QueueNode<T, D>>();
  private head?: QueueNode<T, D>;
  private tail?: QueueNode<T, D>;
  private size = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  enqueue(event: Event<T, D>): void {
    const node: QueueNode<T, D> = { event };
    const key = this.getEventKey(event);

    if (this.map.has(key)) {
      this.moveToFront(key);
      return;
    }

    this.map.set(key, node);
    this.addToFront(node);
    this.ensureSize();
  }

  dequeue(): Event<T, D> | undefined {
    if (!this.tail) return undefined;

    const node = this.tail;
    this.removeNode(node);
    return node.event;
  }

  process(callback: (event: Event<T, D>) => void | Promise<void>): void {
    let current = this.head;
    while (current) {
      callback(current.event);
      current = current.next;
    }
    this.clear();
  }

  clear(): void {
    this.map.clear();
    this.head = undefined;
    this.tail = undefined;
    this.size = 0;
  }

  private getEventKey(event: Event<T, D>): string {
    return `${event.type}:${event.correlationId || event.timestamp}`;
  }

  private addToFront(node: QueueNode<T, D>): void {
    if (!this.head) {
      this.head = this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
    this.size++;
  }

  private moveToFront(key: string): void {
    const node = this.map.get(key);
    if (!node || node === this.head) return;

    // Remove from current position
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.tail) this.tail = node.prev;

    // Add to head
    node.next = this.head;
    node.prev = undefined;
    if (this.head) this.head.prev = node;
    this.head = node;
  }

  private removeNode(node: QueueNode<T, D>): void {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;

    this.map.delete(this.getEventKey(node.event));
    this.size--;
  }

  private ensureSize(): void {
    while (this.size > this.maxSize && this.tail) {
      this.removeNode(this.tail);
    }
  }
}
