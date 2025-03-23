export class CircularDeque<T> {
  public buffer: Uint32Array;
  private dataBuffer: ArrayBuffer;
  public head: number = 0;
  private tail: number = 0;
  private _size: number = 0;
  public mask: number;
  private readonly map = new Map<number, T>();
  private nextId = 1;

  constructor(capacity: number) {
    this.mask = this.nextPowerOfTwo(Math.max(8, capacity)) - 1;
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
      case 'object':
        hash = this.nextId++;
        this.map.set(hash, item);
        break;
      default:
        throw new Error('Unsupported type');
    }
    this.buffer[index] = hash;
  }

  public loadItem(index: number): T {
    const hash = this.buffer[index];

    if (this.map.has(hash)) {
      return this.map.get(hash) as T;
    }
    return hash as T;
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

    this.map.clear();

    this.nextId = 1;

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
