import { Decorator, MetadataKey, MetadataParameterIndex, MetadataScopeType, MetadataTarget, MetadataValue } from './types/metadata.types';
import ReflectStorage from './storage/storage-metadata';
import { constructMetadataKey, identifyTargetType, parseMetadataEntries } from './utils/metadta.utils';
export * from './interface/metadata.interface';
export * from './types/metadata.types';
class Reflector {
  private storage: ReflectStorage;
  constructor() {
    this.storage = new ReflectStorage();
  }

  /**
   * Define metadata for a target and optional property.
   */
  defineMetadata<T>(metadataKey: MetadataKey, value: MetadataValue<T>, target: MetadataTarget, propertyKey?: MetadataKey, parameterIndex?: MetadataParameterIndex): void {
    const actualTarget = identifyTargetType(target);
    const key = constructMetadataKey(metadataKey, actualTarget, propertyKey, parameterIndex);
    this.storage.set(actualTarget.target, key, value);
  }

  /**
   * Retrieve metadata for a target and optional property.
   */
  getMetadata<V>(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey, parameterIndex?: MetadataParameterIndex): MetadataValue<V> | undefined {
    let resolvedTarget = identifyTargetType(target);
    const metadataKeyFormatted = constructMetadataKey(metadataKey, resolvedTarget, propertyKey, parameterIndex);

    while (resolvedTarget) {
      const metadataMap = this.storage.get(resolvedTarget.target);
      if (metadataMap && metadataMap.has(metadataKeyFormatted.toString())) {
        return metadataMap.get(metadataKeyFormatted) as V | undefined;
      }

      const parentPrototype = Object.getPrototypeOf(resolvedTarget.target);
      if (!parentPrototype) {
        break;
      }

      resolvedTarget.target = parentPrototype;
    }
    const parentPrototype = Object.getPrototypeOf(target);
    if (parentPrototype) {
      return this.getMetadata(metadataKey, parentPrototype, propertyKey, parameterIndex);
    }
    return undefined;
  }

  /**
   * Check if metadata exists for a target and optional property.
   */
  hasMetadata(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey, parameterIndex?: MetadataParameterIndex): boolean {
    const actualTarget = identifyTargetType(target);
    const key = constructMetadataKey(metadataKey, actualTarget, propertyKey, parameterIndex);
    return this.storage.has(actualTarget.target!, key);
  }

  /**
   * Delete metadata for a target and optional property.
   */
  deleteMetadata(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey, parameterIndex?: MetadataParameterIndex): boolean {
    const actualTarget = identifyTargetType(target);
    const key = constructMetadataKey(metadataKey, actualTarget, propertyKey, parameterIndex);
    if (!actualTarget) {
      return false;
    }
    return this.storage.delete(actualTarget.target!, key);
  }

  /**
   * Clear all metadata for a target.
   */
  clearMetadata(target: MetadataTarget): void {
    const actualTarget = identifyTargetType(target);
    if (!actualTarget.target) {
      throw new Error('Unable to clear metadata: The provided target is invalid or not properly defined.');
    }
    this.storage.clear(actualTarget.target);
  }
  // Decorator factory
  metadata<T>(key: MetadataKey, value: MetadataValue<T>): Decorator {
    return (target: MetadataTarget, propertyKey?: MetadataKey, descriptorOrIndex?: MetadataParameterIndex | TypedPropertyDescriptor<any>) => {
      if (typeof descriptorOrIndex === 'number') {
        // Parameter decorator (target, prop, index)
        this.defineMetadata(key, value, target, propertyKey, descriptorOrIndex);
      } else if (typeof descriptorOrIndex === 'object') {
        // Method decorator (target, prop, descriptor)
        this.defineMetadata(key, value, target, propertyKey);
      } else if (typeof propertyKey === 'undefined') {
        // Class decorator (target)
        this.defineMetadata(key, value, target);
      } else {
        // Property decorator (target, prop)
        this.defineMetadata(key, value, target, propertyKey);
      }
    };
  }
  /**
   * List all metadata keys for a target and optional property.
   */
  getMetadataKeys(target: MetadataTarget, scope?: MetadataScopeType): MetadataKey[] {
    const resolvedTarget = identifyTargetType(target);
    const metadataMap = this.storage.get(resolvedTarget.target);
    if (!metadataMap) {
      return [];
    }

    const keys = Array.from(metadataMap.entries());
    const result = parseMetadataEntries(keys);

    const filteredKeys = result.filter((rs) => {
      if (scope) {
        return rs.scopes?.includes(scope);
      }
      return true;
    });

    return filteredKeys.map((rs) => rs.metadataKey!);
  }

  /**
   * List all metadata for a target.
   */
  listMetadata<K extends MetadataKey, V>(
    target: MetadataTarget,
  ): {
    count: number;
    metadata: Array<{
      metadataKey: MetadataKey<K>;
      metadataValue: MetadataValue<V>;
    }>;
  } | null {
    const actualTarget = identifyTargetType(target);
    const metadataMap = this.storage.list(actualTarget.target);
    if (!metadataMap) {
      return null;
    }
    const entries = Array.from(metadataMap.entries()) as [K, V][];
    const parsedEntries = parseMetadataEntries<K, V>(entries).filter((entry): entry is { metadataKey: MetadataKey<K>; metadataValue: MetadataValue<V> } => entry.metadataKey !== undefined);
    return {
      count: parsedEntries.length,
      metadata: parsedEntries.map((entry) => ({
        metadataKey: entry.metadataKey,
        metadataValue: entry.metadataValue,
      })),
    };
  }
}

export default new Reflector();
