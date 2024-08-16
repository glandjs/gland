import { MetadataKey, MetadataStorage, MetadataTarget, MetadataValue } from '../types/types';

namespace Reflect {
  const metadataStorage: MetadataStorage = new Map<MetadataTarget, Map<MetadataKey, MetadataValue>>();

  export function init(metadataKey: MetadataKey, metadataValue: MetadataValue, target: MetadataTarget, propertyKey?: MetadataKey): void {
    let targetMetadata = metadataStorage.get(target);
    if (!targetMetadata) {
      targetMetadata = new Map<MetadataKey, MetadataValue>();
      metadataStorage.set(target, targetMetadata);
    }

    const key = propertyKey !== undefined ? `${String(propertyKey)}:${String(metadataKey)}` : metadataKey;
    targetMetadata.set(key, metadataValue);
  }

  export function has(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey): boolean {
    return get(metadataKey, target, propertyKey) !== undefined;
  }

  export function hasOwn(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey): boolean {
    const targetMetadata = metadataStorage.get(target);
    if (!targetMetadata) {
      return false;
    }

    const key = propertyKey !== undefined ? `${propertyKey.toString()}:${String(metadataKey)}` : metadataKey;
    return targetMetadata.has(key);
  }

  export function get(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey): MetadataValue {
    const targetMetadata = metadataStorage.get(target);
    if (!targetMetadata) {
      return undefined;
    }

    const key = propertyKey !== undefined ? `${propertyKey.toString()}:${String(metadataKey)}` : metadataKey;
    return targetMetadata.get(key);
  }

  export function getOwn(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey): MetadataValue {
    const targetMetadata = metadataStorage.get(target);
    if (!targetMetadata) {
      return undefined;
    }

    const key = propertyKey !== undefined ? `${propertyKey.toString()}:${String(metadataKey)}` : metadataKey;
    return targetMetadata.get(key);
  }

  export function getKeys(target: MetadataTarget, propertyKey?: MetadataKey): MetadataKey[] {
    const targetMetadata = metadataStorage.get(target);
    if (!targetMetadata) {
      return [];
    }

    const keys: MetadataKey[] = [];
    targetMetadata.forEach((_, key) => {
      if (propertyKey !== undefined) {
        const prefix = `${propertyKey.toString()}:`;
        if (key.toString().startsWith(prefix)) {
          keys.push(key.toString().substring(prefix.length));
        }
      } else {
        keys.push(key);
      }
    });

    return keys;
  }

  export function getOwnKeys(target: MetadataTarget, propertyKey?: MetadataKey): MetadataKey[] {
    return getKeys(target, propertyKey);
  }

  export function del(metadataKey: MetadataKey, target: MetadataTarget, propertyKey?: MetadataKey): boolean {
    const targetMetadata = metadataStorage.get(target);
    if (!targetMetadata) {
      return false;
    }

    const key = propertyKey !== undefined ? `${propertyKey.toString()}:${String(metadataKey)}` : metadataKey;
    return targetMetadata.delete(key);
  }
}

export default Reflect;
