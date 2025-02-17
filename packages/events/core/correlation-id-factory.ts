import { CorrelationId } from '../types';

export class CorrelationIdFactory {
  private readonly namespace: string;
  private sequence: number = 0;
  private lastTimestamp: number = 0;

  constructor(namespace: string = 'gland') {
    this.namespace = namespace;
  }

  create(): CorrelationId {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const sequence = this.getSequenceNumber(timestamp);

    return this.formatId({
      timestamp,
      sequence,
      random,
      node: this.namespace,
    }) as CorrelationId;
  }

  private getSequenceNumber(timestamp: number): number {
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 0xfff; // 12-bit sequence
    } else {
      this.sequence = 0;
      this.lastTimestamp = timestamp;
    }
    return this.sequence;
  }

  private formatId(parts: { timestamp: number; sequence: number; random: string; node: string }): string {
    return [parts.timestamp.toString(16).padStart(10, '0'), parts.sequence.toString(16).padStart(3, '0'), parts.random, parts.node].join('-');
  }

  static validate(id: string): id is CorrelationId {
    return /^[0-9a-f]{10}-[0-9a-f]{3}-[a-z0-9]{13}-[a-z]+$/.test(id);
  }
}
