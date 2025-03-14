export class CircularDeque<T> {
  private buffer: Array<T | undefined>;
  private head: number = 0;
  private tail: number = 0;
  private _size: number = 0;
  private mask: number;

  constructor(private capacity: number) {
    this.capacity = this.nextPowerOfTwo(Math.max(8, capacity));
    this.buffer = new Array(this.capacity);
    this.mask = this.capacity - 1;
  }

  get size(): number {
    return this._size;
  }

  isEmpty(): boolean {
    return this._size === 0;
  }

  isFull(): boolean {
    return this._size === this.capacity;
  }

  addFirst(item: T): void {
    if (this._size >= this.capacity * 0.75) {
      this.resize();
    }

    // Using bitwise operations
    this.head = (this.head - 1) & this.mask;
    this.buffer[this.head] = item;
    this._size++;
  }

  addLast(item: T): void {
    if (this._size >= this.capacity * 0.75) {
      this.resize();
    }

    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) & this.mask;
    this._size++;
  }

  removeFirst(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined; // Help garbage collection
    this.head = (this.head + 1) & this.mask;
    this._size--;

    return item;
  }

  removeLast(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    this.tail = (this.tail - 1) & this.mask;
    const item = this.buffer[this.tail];
    this.buffer[this.tail] = undefined; // Help garbage collection
    this._size--;

    return item;
  }

  peekFirst(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.buffer[this.head];
  }

  peekLast(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    const lastIndex = (this.tail - 1) & this.mask;
    return this.buffer[lastIndex];
  }

  remove(item: T): boolean {
    if (this.isEmpty()) {
      return false;
    }

    const objectReferences = new WeakMap();
    const isObject = typeof item === 'object' && item !== null;

    if (isObject) {
      objectReferences.set(item, true);
    }

    let index = this.head;
    let count = 0;

    while (count < this._size) {
      const currentItem = this.buffer[index];

      const itemMatches = isObject && currentItem !== null && typeof currentItem === 'object' ? objectReferences.has(currentItem) : currentItem === item;

      if (itemMatches) {
        this.removeAtIndex(index);
        return true;
      }

      index = (index + 1) & this.mask;
      count++;
    }

    return false;
  }

  toArray(): T[] {
    const result: T[] = [];
    if (this.isEmpty()) {
      return result;
    }

    result.length = this._size;

    let index = this.head;
    for (let i = 0; i < this._size; i++) {
      result[i] = this.buffer[index] as T;
      index = (index + 1) & this.mask;
    }

    return result;
  }

  clear(): void {
    if (this._size > 0) {
      let index = this.head;
      for (let i = 0; i < this._size; i++) {
        this.buffer[index] = undefined;
        index = (index + 1) & this.mask;
      }
    }

    this.head = 0;
    this.tail = 0;
    this._size = 0;
  }

  private removeAtIndex(index: number): void {
    // If removing from the head or tail, use the specialized methods
    if (index === this.head) {
      this.removeFirst();
      return;
    }

    const lastIndex = (this.tail - 1) & this.mask;
    if (index === lastIndex) {
      this.removeLast();
      return;
    }

    const distanceToHead = (index - this.head + this.capacity) & this.mask;
    const distanceToTail = (this.tail - index - 1 + this.capacity) & this.mask;

    if (distanceToHead <= distanceToTail) {
      let current = index;
      let previous = (current - 1) & this.mask;

      while (current !== this.head) {
        this.buffer[current] = this.buffer[previous];
        current = previous;
        previous = (previous - 1) & this.mask;
      }

      this.buffer[this.head] = undefined;
      this.head = (this.head + 1) & this.mask;
    } else {
      let current = index;
      let next = (current + 1) & this.mask;

      while (next !== this.tail) {
        this.buffer[current] = this.buffer[next];
        current = next;
        next = (next + 1) & this.mask;
      }

      this.tail = (this.tail - 1) & this.mask;
      this.buffer[this.tail] = undefined;
    }

    this._size--;
  }

  private resize(): void {
    const newCapacity = this.capacity * 2;
    const newBuffer = new Array<T | undefined>(newCapacity);
    const newMask = newCapacity - 1;

    // Copy elements in order to the new buffer
    let oldIndex = this.head;
    for (let i = 0; i < this._size; i++) {
      newBuffer[i] = this.buffer[oldIndex];
      oldIndex = (oldIndex + 1) & this.mask;
    }

    this.buffer = newBuffer;
    this.capacity = newCapacity;
    this.mask = newMask;
    this.head = 0;
    this.tail = this._size;
  }

  private nextPowerOfTwo(n: number): number {
    // bit manipulation to find next power of 2
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
    return n;
  }
}
