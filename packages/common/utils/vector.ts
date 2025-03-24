export class Vector {
  private data: Uint32Array;
  public size = 0;

  constructor(initialCapacity = 1024) {
    this.data = new Uint32Array(Math.ceil(initialCapacity / 32));
  }

  set(index: number): void {
    if (index < 0) return;

    const wordIndex = index >>> 5;
    const bitOffset = index & 31;
    const mask = 1 << bitOffset;

    this.ensureCapacity(wordIndex);

    this.data[wordIndex] |= mask;
    this.size = Math.max(this.size, index + 1);
  }

  unset(index: number): void {
    if (index < 0 || index >= this.size) return;

    const wordIndex = index >>> 5;
    const bitOffset = index & 31;
    const mask = ~(1 << bitOffset);

    this.data[wordIndex] &= mask;

    if (index === this.size - 1) {
      this.recalculateSize();
    }
  }

  get(index: number): boolean {
    if (index < 0 || index >= this.size) return false;

    const wordIndex = index >>> 5;
    const bitOffset = index & 31;
    const mask = 1 << bitOffset;

    return (this.data[wordIndex] & mask) !== 0;
  }

  hasAny(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0) fromIndex = 0;
    if (toIndex > this.size) toIndex = this.size;
    if (fromIndex >= toIndex) return false;

    const startWordIdx = fromIndex >>> 5;
    const endWordIdx = (toIndex - 1) >>> 5;

    if (startWordIdx === endWordIdx) {
      const startMask = 0xffffffff << (fromIndex & 31);
      const endMask = 0xffffffff >>> (31 - ((toIndex - 1) & 31));
      const mask = startMask & endMask;
      return (this.data[startWordIdx] & mask) !== 0;
    }

    const firstMask = 0xffffffff << (fromIndex & 31);
    if ((this.data[startWordIdx] & firstMask) !== 0) return true;

    for (let i = startWordIdx + 1; i < endWordIdx; i++) {
      if (this.data[i] !== 0) return true;
    }

    const lastMask = 0xffffffff >>> (31 - ((toIndex - 1) & 31));
    return (this.data[endWordIdx] & lastMask) !== 0;
  }

  private ensureCapacity(wordIndex: number): void {
    if (wordIndex >= this.data.length) {
      const newLength = Math.max(this.data.length * 2, wordIndex + 1);
      const newData = new Uint32Array(newLength);
      newData.set(this.data);
      this.data = newData;
    }
  }

  private recalculateSize(): void {
    for (let i = this.data.length - 1; i >= 0; i--) {
      if (this.data[i] !== 0) {
        const word = this.data[i];
        const msb = 31 - Math.clz32(word);
        this.size = (i << 5) + msb + 1;
        return;
      }
    }

    this.size = 0;
  }
}
