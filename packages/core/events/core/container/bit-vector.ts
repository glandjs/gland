export class BitVector {
  private view: Uint32Array;
  private static readonly BITS_PER_INT = 32;
  // Track the highest set bit for faster operations
  private highestSetBit = -1;

  constructor(initialCapacity = 1024) {
    const size = Math.ceil(initialCapacity / BitVector.BITS_PER_INT);
    this.view = new Uint32Array(size);
  }

  set(bit: number): void {
    const { index, mask } = this.getBitPosition(bit);
    this.ensureCapacity(index);
    this.view[index] |= mask;
    this.highestSetBit = Math.max(this.highestSetBit, bit);
  }

  get(bit: number): boolean {
    if (bit > this.highestSetBit) return false;
    const { index, mask } = this.getBitPosition(bit);
    return index < this.view.length && (this.view[index] & mask) !== 0;
  }

  clear(bit: number): void {
    if (bit > this.highestSetBit) return;
    const { index, mask } = this.getBitPosition(bit);
    if (index < this.view.length) {
      this.view[index] &= ~mask;

      //
      if (bit === this.highestSetBit) {
        this.recalculateHighestBit();
      }
    }
  }

  hasAnyInRange(start: number, end: number): boolean {
    if (start > this.highestSetBit) return false;

    const startIndex = start >>> 5;
    const endIndex = Math.min((end - 1) >>> 5, this.view.length - 1);

    for (let i = startIndex + 1; i < endIndex; i++) {
      if (this.view[i] !== 0) return true;
    }

    const startOffset = start & 31;
    const startMask = (0xffffffff << startOffset) >>> 0;

    if (startIndex === endIndex) {
      const endOffset = end & 31;
      const endMask = (0xffffffff >>> (32 - endOffset)) >>> 0;
      const mask = startMask & endMask;
      return (this.view[startIndex] & mask) !== 0;
    } else {
      if ((this.view[startIndex] & startMask) !== 0) return true;

      const endOffset = end & 31;
      if (endOffset > 0) {
        const endMask = (0xffffffff >>> (32 - endOffset)) >>> 0;
        if ((this.view[endIndex] & endMask) !== 0) return true;
      }
    }

    return false;
  }

  nextSetBit(fromIndex: number): number {
    if (fromIndex > this.highestSetBit) return -1;

    let wordIndex = fromIndex >>> 5;
    let bitIndex = fromIndex & 31;

    let word = this.view[wordIndex] & ((0xffffffff << bitIndex) >>> 0);

    while (wordIndex < this.view.length) {
      if (word !== 0) {
        return wordIndex * 32 + Math.clz32(~(Math.clz32(word) - 1) >>> 0) - 1;
      }

      if (++wordIndex < this.view.length) {
        word = this.view[wordIndex];
      } else {
        break;
      }
    }

    return -1;
  }

  private getBitPosition(bit: number) {
    const index = bit >>> 5;
    const offset = bit & 31;
    const mask = 1 << offset;
    return { index, mask };
  }

  private ensureCapacity(requiredIndex: number): void {
    if (requiredIndex >= this.view.length) {
      const newSize = Math.max(this.view.length * 2, requiredIndex + 1);
      const newView = new Uint32Array(newSize);
      newView.set(this.view);
      this.view = newView;
    }
  }

  private recalculateHighestBit(): void {
    for (let i = this.view.length - 1; i >= 0; i--) {
      if (this.view[i] !== 0) {
        const word = this.view[i];
        const bitPos = 31 - Math.clz32(word);
        this.highestSetBit = i * 32 + bitPos;
        return;
      }
    }
    this.highestSetBit = -1;
  }
}
