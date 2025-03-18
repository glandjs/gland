export class CircularDeque<T> {
  public buffer: Uint32Array;
  private dataBuffer: ArrayBuffer;
  private head: number = 0;
  private tail: number = 0;
  private _size: number = 0;
  private mask: number;
  private readonly objectMap = new Map<number, T>();
  private nextObjectId = 1;

  constructor(capacity: number) {
    this.mask = nextPowerOfTwo(Math.max(8, capacity)) - 1;
    this.dataBuffer = new ArrayBuffer((this.mask + 1) * 4);
    this.buffer = new Uint32Array(this.dataBuffer);
  }

  get size(): number {
    return this._size;
  }
  isEmpty(): boolean {
    return this._size === 0;
  }
  isFull(): boolean {
    return this._size >= this.buffer.length * 0.75;
  }

  addFirst(item: T): void {
    if (this.isFull()) this.resize();

    this.head = (this.head - 1) & this.mask;
    this.storeItem(this.head, item);
    this._size++;
  }

  removeFirst(): T | undefined {
    if (this.isEmpty()) return undefined;

    const item = this.loadItem(this.head);
    this.buffer[this.head] = 0;
    this.head = (this.head + 1) & this.mask;
    this._size--;

    return item;
  }

  removeLast(): T | undefined {
    if (this.isEmpty()) return undefined;

    this.tail = (this.tail - 1) & this.mask;
    const item = this.loadItem(this.tail);
    this.buffer[this.tail] = 0;
    this._size--;

    return item;
  }

  private storeItem(index: number, item: T): void {
    let hash: number;

    switch (typeof item) {
      case 'number':
        hash = item >>> 0;
        break;

      case 'string':
        hash = this.fnv1a(item);
        break;

      case 'object':
        hash = this.nextObjectId++;
        this.objectMap.set(hash, item);
        break;

      default:
        throw new Error('Unsupported type');
    }

    this.buffer[index] = hash;
  }

  private loadItem(index: number): T {
    const hash = this.buffer[index];

    switch (true) {
      case hash === 0:
        return undefined!;

      case typeof hash === 'number' && hash <= 0xffffffff:
        return hash as T;

      case this.objectMap.has(hash):
        return this.objectMap.get(hash)!;

      default:
        throw new Error('Data corruption detected');
    }
  }

  private fnv1a(str: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
  }

  private resize(): void {
    const newCapacity = this.nextPowerOfTwo(this.buffer.length * 2);
    const newBuffer = new Uint32Array(newCapacity);

    let oldIndex = this.head;
    for (let i = 0; i < this._size; i++) {
      newBuffer[i] = this.buffer[oldIndex];
      oldIndex = (oldIndex + 1) & this.mask;
    }

    this.buffer = newBuffer;
    this.mask = newCapacity - 1;
    this.head = 0;
    this.tail = this._size;
    this.dataBuffer = this.buffer.buffer;
  }

  clear(): void {
    this.buffer.fill(0);

    this.objectMap.clear();

    this.nextObjectId = 1;

    this.head = 0;
    this.tail = 0;
    this._size = 0;
  }
  private nextPowerOfTwo(n: number): number {
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    return n + 1;
  }
}
