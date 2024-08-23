import { MetadataKey, MetadataStorage, MetadataTarget, MetadataValue } from '../types';

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
}

export default Reflect;
