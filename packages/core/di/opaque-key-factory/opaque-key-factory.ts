import { Constructor, DynamicModule, MODULE_METADATA, ModuleMetadata, Provider } from '@gland/common';
import { ByReferenceModuleOpaqueKeyFactory } from './by-reference-key';
import { DeepHashedModuleOpaqueKeyFactory } from './deep-hash-key';
import { ModuleOpaqueKey, ModuleOpaqueKeyFactory, OpaqueToken } from './opaque.interface';

export class ModuleTokenFactory implements ModuleOpaqueKeyFactory {
  private readonly factories: Record<'deep-hash' | 'shallow' | 'random', ModuleOpaqueKeyFactory> = {
    'deep-hash': new DeepHashedModuleOpaqueKeyFactory(),
    shallow: new ByReferenceModuleOpaqueKeyFactory({ keyGenerationStrategy: 'shallow' }),
    random: new ByReferenceModuleOpaqueKeyFactory({ keyGenerationStrategy: 'random' }),
  };

  constructor(private readonly strategy: 'deep-hash' | 'shallow' | 'random' = 'deep-hash') {}

  getKeyGenerationStrategy(): 'deep-hash' | 'shallow' | 'random' {
    return this.strategy;
  }

  create<T>(metadata: ModuleMetadata<T>): ModuleOpaqueKey<T> {
    return this.factories[this.strategy].create(metadata);
  }

  createForProvider<T>(provider: Provider<T>): OpaqueToken<T> {
    return this.factories[this.strategy].createForProvider(provider);
  }

  createForDynamicModule<T>(module: Constructor<T> | DynamicModule<T>): ModuleOpaqueKey<T> {
    const metadata = typeof module === 'function' ? Reflect.getMetadata(MODULE_METADATA.MODULE_METADATA, module) : module;
    return this.create(metadata);
  }

  getModuleName(token: ModuleOpaqueKey<any>): string {
    if (this.strategy === 'deep-hash') {
      return `Module:${token.slice(0, 8)}`;
    }
    return token.split(':')[0];
  }

  isModuleToken(token: string): boolean {
    return token.startsWith('Module:') || token.startsWith('rand_');
  }
}
