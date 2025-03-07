import { randomFillSync, randomUUID } from 'node:crypto';

export type UUID = string;
type BufferLike = Uint8Array | Buffer;
type UUIDOptions = {
  buffer?: BufferLike;
  offset?: number;
  random?: BufferLike;
  rng?: () => BufferLike;
};
export class CryptoUUID {
  private static readonly VERSION = 0x40;
  private static readonly VARIANT = 0x80;
  private static readonly POOL_SIZE = 256;
  private static pool = new Uint8Array(this.POOL_SIZE);
  private static poolPtr = this.POOL_SIZE;

  static generate(options?: UUIDOptions): UUID;
  static generate<T extends BufferLike>(options: UUIDOptions, buffer: T): T;
  static generate(options?: UUIDOptions, buffer?: BufferLike): UUID | BufferLike {
    if (buffer && !options) {
      return randomUUID();
    }

    const rnds = this.getEntropy(options);

    rnds[6] = (rnds[6] & 0x0f) | this.VERSION;
    rnds[8] = (rnds[8] & 0x3f) | this.VARIANT;

    if (buffer) {
      const offset = options?.offset || 0;
      this.validateBuffer(buffer, offset);
      buffer.set(rnds, offset);
      return buffer;
    }

    return this.format(rnds);
  }

  /** Validate UUID structure and version/variant bits */
  static validate(uuid: string | BufferLike): boolean {
    if (typeof uuid === 'string') {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
    }

    return this.isValidBuffer(uuid);
  }

  private static getEntropy(options: UUIDOptions = {}): BufferLike {
    if (options.random?.length! >= 16) return options.random!;
    if (options.rng) return options.rng();

    if (this.poolPtr > this.POOL_SIZE - 16) {
      randomFillSync(this.pool);
      this.poolPtr = 0;
    }

    return this.pool.slice(this.poolPtr, (this.poolPtr += 16));
  }

  private static format(bytes: BufferLike): UUID {
    return [
      this.hex(bytes, 0, 4), // time_low
      this.hex(bytes, 4, 6), // time_mid
      this.hex(bytes, 6, 8), // time_hi_and_version
      this.hex(bytes, 8, 10), // clock_seq_hi_and_reserved + clock_seq_low
      this.hex(bytes, 10, 16), // node
    ].join('-');
  }

  private static hex(bytes: BufferLike, start: number, end: number): string {
    return Buffer.from(bytes.slice(start, end) as Uint8Array).toString('hex');
  }

  private static validateBuffer(buffer: BufferLike, offset: number): void {
    if (offset < 0 || offset + 16 > buffer.length) {
      throw new RangeError(`Invalid buffer range: ${offset} to ${offset + 16}`);
    }
  }

  private static isValidBuffer(buffer: BufferLike): boolean {
    return buffer[6] === (this.VERSION & 0x0f) && (buffer[8] & 0xc0) === this.VARIANT;
  }
}
