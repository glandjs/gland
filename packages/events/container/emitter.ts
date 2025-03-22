import { type Callback } from '@medishn/toolkit';

export class Emitter {
  execute(nodeListeners: Set<Callback>, ...args: any[]): void {
    nodeListeners.forEach((listener) => listener(...args));
  }
}
