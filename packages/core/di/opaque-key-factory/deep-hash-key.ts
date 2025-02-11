import { ImportableModule, ModuleMetadata, Provider } from '@gland/common';
import { ModuleOpaqueKey, ModuleOpaqueKeyFactory, OpaqueToken } from './opaque.interface';
import { createHash } from 'crypto';
import { getProviderKey, getProviderType } from '../../utils';

export class DeepHashedModuleOpaqueKeyFactory implements ModuleOpaqueKeyFactory {
  private readonly hashCache = new Map<string, string>();

  getKeyGenerationStrategy(): 'deep-hash' {
    return 'deep-hash';
  }

  create<T>(metadata: ModuleMetadata<T>): ModuleOpaqueKey<T> {
    const serialized = this.serializeModuleMetadata(metadata);
    const key = this.generateKey(serialized);
    return this.brandModuleKey<T>(key);
  }

  createForProvider<T>(provider: Provider<T>): OpaqueToken<T> {
    const serialized = JSON.stringify(provider);
    const key = this.generateKey(serialized);
    return this.brandProviderKey<T>(key);
  }

  private serializeModuleMetadata<T>(metadata: ModuleMetadata<T>): string {
    const { imports, providers, controllers, exports } = metadata;
    const sortedImports = imports?.map((imp) => this.createImportSignature(imp)).sort();
    const sortedProviders = providers?.map((prov) => this.createProviderSignature(prov)).sort();
    const sortedControllers = controllers?.map((c) => c.name).sort();
    const sortedExports = exports?.map((e) => String(e)).sort();

    return JSON.stringify({
      imports: sortedImports,
      providers: sortedProviders,
      controllers: sortedControllers,
      exports: sortedExports,
    });
  }

  private createImportSignature<T>(module: ImportableModule<T>): string {
    if (typeof module === 'function') {
      return `Module:${module.name}`;
    }
    return `DynamicModule:${module.module.name}`;
  }

  private createProviderSignature<T>(provider: Provider<T>): string {
    const providerType = getProviderType(provider);
    const providerKey = getProviderKey(provider);
    return `${providerType}:${providerKey}`;
  }

  private generateKey(content: string): string {
    if (this.hashCache.has(content)) {
      return this.hashCache.get(content)!;
    }
    const hash = createHash('sha256').update(content).digest('hex');
    this.hashCache.set(content, hash);
    return hash;
  }

  private brandModuleKey<T>(key: string): ModuleOpaqueKey<T> {
    return key as ModuleOpaqueKey<T>;
  }

  private brandProviderKey<T>(key: string): OpaqueToken<T> {
    return key as OpaqueToken<T>;
  }
}
