import { InjectionToken } from '@gland/common';
import { Constructor } from '@medishn/toolkit';

export class InstanceWrapper<T = any> {
  private instance: T | undefined;

  constructor(public readonly token: InjectionToken, public readonly metatype: Constructor<T>, instance?: T) {
    if (instance) {
      this.instance = instance;
    }
  }

  get id(): string {
    return this.token?.toString() || this.metatype?.name || 'unknown';
  }

  getInstance(): T {
    if (!this.instance) {
      throw new Error(`Instance ${this.id} not initialized`);
    }
    return this.instance;
  }

  isNotMetatype(metatype: Constructor<any>): boolean {
    return this.metatype !== metatype;
  }
}
