import { Decorator, MetadataKey, MetadataParameterIndex, MetadataTarget, MetadataValue } from './types/metadata.types';
import ReflectStorage from './storage/storage-metadata';
import { constructKey, MetadataScope, MetadataScopeType, resolveTargetClass } from './utils/metadta.utils';
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
  defineMetadata<T extends MetadataValue>(metadataKey: MetadataKey, value: T, target: MetadataTarget, propertyKey?: MetadataKey, parameterIndex?: MetadataParameterIndex): void {
    const key = constructKey(metadataKey, propertyKey, parameterIndex);
    const actualTarget = resolveTargetClass(target);
    this.storage.set(actualTarget!, key, value);
  }

  /**
   * Retrieve metadata for a target and optional property.
   */
  getMetadata<T = MetadataValue>(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey, parameterIndex?: MetadataParameterIndex): T | unknown {
    const key = constructKey(metadataKey, propertyKey, parameterIndex);
    let currentTarget = resolveTargetClass(target);
    while (currentTarget) {
      const metadataMap = this.storage.get(currentTarget);

      if (metadataMap && metadataMap.has(key)) {
        return metadataMap.get(key);
      }
      currentTarget = Object.getPrototypeOf(currentTarget);
    }
    return undefined;
  }

  /**
   * Check if metadata exists for a target and optional property.
   */
  hasMetadata(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey, parameterIndex?: MetadataParameterIndex): boolean {
    const key = constructKey(metadataKey, propertyKey, parameterIndex);
    return this.storage.has(target, key);
  }

  /**
   * Delete metadata for a target and optional property.
   */
  deleteMetadata(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey, parameterIndex?: MetadataParameterIndex): boolean {
    const key = constructKey(metadataKey, propertyKey, parameterIndex);
    const actualTarget = resolveTargetClass(target);
    if (!actualTarget) {
      return false;
    }
    return this.storage.delete(actualTarget, key);
  }

  /**
   * Clear all metadata for a target.
   */
  clearMetadata(target: MetadataTarget): void {
    const actualTarget = resolveTargetClass(target);
    if (!actualTarget) {
      throw new Error('Unable to clear metadata: The provided target is invalid or not properly defined.');
    }
    this.storage.clear(actualTarget);
  }
  // Decorator factory
  metadata(key: MetadataKey, value: MetadataValue): Decorator {
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
  getMetadataKeys(target: MetadataTarget, scope?: MetadataScopeType, propertyName?: string, parameterIndex?: number): MetadataKey[] {
    const resolvedTarget = resolveTargetClass(target);
    const metadataMap = this.storage.get(resolvedTarget!);

    if (!metadataMap) {
      return [];
    }

    return Array.from(metadataMap.keys())
      .filter((key) => {
        const segments = String(key).split(':');
        const currentScope = segments[0];

        if (scope && currentScope !== MetadataScope[scope.toUpperCase()]) {
          return false;
        }

        if (propertyName && segments.length > 1 && segments[1] !== propertyName) {
          return false;
        }

        if (typeof parameterIndex === 'number') {
          const hasParamSegment = segments.length > 3 && segments[2] === 'param';
          const hasCorrectIndex = hasParamSegment && Number(segments[3]) === parameterIndex;

          if (!hasCorrectIndex) {
            return false;
          }
        }

        return true;
      })
      .map((key) => {
        const segments = String(key).split(':');
        return segments[segments.length - 1];
      });
  }

  /**
   * List all metadata for a target.
   */
  listMetadata<K extends MetadataKey, V extends MetadataValue>(target: MetadataTarget): Map<K, V> | null {
    const metadataMap = this.storage.list(target);
    if (metadataMap) {
      return metadataMap as Map<K, V>;
    }
    return null;
  }

  /**
   * List all metadata across all targets.
   */
  listAllMetadata(): Map<string, Map<MetadataKey, MetadataValue>> {
    return this.storage.allList();
  }
}

export default new Reflector();
