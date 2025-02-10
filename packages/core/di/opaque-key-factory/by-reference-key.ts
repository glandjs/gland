import { ModuleMetadata, Provider } from '@gland/common';
import { ModuleOpaqueKey, ModuleOpaqueKeyFactory, OpaqueToken } from './opaque.interface';
import { getProviderKey, getProviderType } from '../../utils';

export class ByReferenceModuleOpaqueKeyFactory implements ModuleOpaqueKeyFactory {
  private counter = 0;

  constructor(
    private readonly options: {
      keyGenerationStrategy: 'shallow' | 'random';
    },
  ) {}

  getKeyGenerationStrategy() {
    return this.options.keyGenerationStrategy;
  }

  create<T>(metadata: ModuleMetadata<T>): ModuleOpaqueKey<T> {
    if (this.options.keyGenerationStrategy === 'random') {
      return this.generateRandomKey<T>();
    }
    return this.generateShallowKey<T>(metadata);
  }

  createForProvider<T>(provider: Provider<T>): OpaqueToken<T> {
    return this.generateProviderKey<T>(provider);
  }

  private generateRandomKey<T>(): ModuleOpaqueKey<T> {
    const key = `rand_${Date.now()}_${this.counter++}_${Math.random().toString(36).slice(2)}`;
    return this.brandModuleKey<T>(key);
  }

  private generateShallowKey<T>(metadata: ModuleMetadata<T>): ModuleOpaqueKey<T> {
    const base = `Module:${metadata.constructor?.name ?? 'Anonymous'}`;
    const key = `${base}:${Math.random().toString(36).slice(2, 10)}`;
    return this.brandModuleKey<T>(key);
  }

  private generateProviderKey<T>(provider: Provider<T>): OpaqueToken<T> {
    const type = getProviderType(provider);
    const key = `${type}:${getProviderKey(provider)}`;
    return this.brandProviderKey<T>(key);
  }

  private brandModuleKey<T>(key: string): ModuleOpaqueKey<T> {
    return key as ModuleOpaqueKey<T>;
  }

  private brandProviderKey<T>(key: string): OpaqueToken<T> {
    return key as OpaqueToken<T>;
  }
}
