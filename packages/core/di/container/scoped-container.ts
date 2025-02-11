import { InjectionToken } from '@gland/common';
import { Container } from './container';

export class ScopedContainer<T = any> {
  private readonly instances = new Map<InjectionToken<T>, any>();

  constructor(private readonly parent: Container, public readonly scopeId: string) {}

  hasInstance<IT>(token: InjectionToken<IT>): boolean {
    return this.instances.has(token);
  }

  getInstance<T>(token: InjectionToken<T>): T | undefined {
    return this.instances.get(token);
  }

  setInstance<T>(token: InjectionToken<T>, instance: T): void {
    this.instances.set(token, instance);
  }

  clear(): void {
    this.instances.clear();
  }

  getParent(): Container {
    return this.parent;
  }
}
