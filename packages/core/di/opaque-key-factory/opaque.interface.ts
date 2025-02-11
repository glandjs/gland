import { ModuleMetadata, Provider } from '@gland/common';
export const OPAQUE_TOKEN_SYMBOL = Symbol('gland.opaque-token');

export type OpaqueToken<T> = string & {
  [OPAQUE_TOKEN_SYMBOL]: T;
  __brand: 'OpaqueToken';
};

export type ModuleOpaqueKey<T> = OpaqueToken<ModuleMetadata<T>> & {
  __moduleBrand: T;
};
export interface OpaqueKeyFactory {
  create<T>(metadata: ModuleMetadata<T>): ModuleOpaqueKey<T>;
  createForProvider<T>(provider: Provider<T>): OpaqueToken<T>;
}

export interface ModuleOpaqueKeyFactory extends OpaqueKeyFactory {
  create<T>(metadata: ModuleMetadata<T>): ModuleOpaqueKey<T>;
  getKeyGenerationStrategy(): 'deep-hash' | 'shallow' | 'random';
}
