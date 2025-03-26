import { ModuleOpaqueKeyFactory } from './module-opaque-key.interface';
import { Constructor } from '@medishn/toolkit';
export class DeepHashedModule implements ModuleOpaqueKeyFactory {
  createForStatic(moduleCls: Constructor): string {
    return `module:${this.hashConstructor(moduleCls)}`;
  }

  private hashConstructor(constructor: Constructor): string {
    const props = Object.getOwnPropertyNames(constructor?.prototype)
      .filter((prop) => prop !== 'constructor')
      .sort();

    return this.generateHash(
      JSON.stringify({
        name: constructor.name,
        props,
      }),
    );
  }

  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}
