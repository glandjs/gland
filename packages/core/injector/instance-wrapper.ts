import type { Constructor } from '@medishn/toolkit';

export class InstanceWrapper<T = any> {
  constructor(
    public readonly token: Constructor,
    private readonly instance?: T,
  ) {}

  get id(): string {
    return this.token?.toString() || this.token?.name || 'unknown';
  }

  getInstance(): T {
    if (!this.instance) {
      throw new Error(`Instance ${this.id} not initialized`);
    }
    return this.instance;
  }
}
