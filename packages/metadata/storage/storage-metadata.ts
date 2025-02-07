import { isClass } from '@gland/common/utils';
import { InMemoryCacheStore } from '@gland/cache';
import { MetadataStorage } from '../interface/metadata.interface';
import { MetadataKey, MetadataTarget, MetadataValue } from '../types/metadata.types';
import { MAXIMUM_CACHE_SIZE } from '@gland/common';

class ReflectStorage<K extends MetadataKey = MetadataKey, V extends MetadataValue = MetadataValue> implements MetadataStorage<K, V> {
  private storage: InMemoryCacheStore<string, Map<K, V>>;
  constructor() {
    this.storage = new InMemoryCacheStore({
      maxSize: MAXIMUM_CACHE_SIZE,
      evictionPolicy: 'LRU',
      storage: 'map',
    });
  }
  private getTargetIdentifier(target: MetadataTarget): string {
    if (typeof target === 'function') {
      return isClass(target) ? `class:${target.name}` : `function:${target.name}@${target.length}`;
    }
    if (target.constructor && target.constructor.prototype === target) {
      return `prototype:${target.constructor.name}`;
    }
    return `instance:${target.constructor.name}`;
  }

  private ensureMetadataMap(target: MetadataTarget): Map<K, V> {
    const targetKey = this.getTargetIdentifier(target);
    let metadataMap = this.storage.get(targetKey);
    if (!metadataMap) {
      metadataMap = new Map<K, V>();
      this.storage.set(targetKey, metadataMap);
    }
    return metadataMap;
  }
  get(target: MetadataTarget): Map<K, V> {
    const targetKey = this.getTargetIdentifier(target);
    const metadataMap = this.storage.get(targetKey);
    return metadataMap instanceof Map ? metadataMap : new Map<K, V>();
  }

  set(target: MetadataTarget, key: K, value: V): void {
    const metadataMap = this.ensureMetadataMap(target);
    metadataMap.set(key, value);
    const targetKey = this.getTargetIdentifier(target);
    this.storage.set(targetKey, metadataMap);
  }

  has(target: MetadataTarget, key: K): boolean {
    const metadataMap = this.get(target);
    return metadataMap.has(key);
  }

  delete(target: MetadataTarget, key: K): boolean {
    const targetKey = this.getTargetIdentifier(target);
    const metadataMap = this.get(target);
    const result = metadataMap.delete(key);
    if (metadataMap.size === 0) {
      this.storage.delete(targetKey);
    } else {
      this.storage.set(targetKey, metadataMap);
    }

    return result;
  }
  clear(target: MetadataTarget): void {
    const targetKey = this.getTargetIdentifier(target);
    this.storage.delete(targetKey);
  }

  list(target: MetadataTarget): Map<K, V> | null {
    const targetKey = this.getTargetIdentifier(target);
    const metadataMap = this.storage.get(targetKey);
    if (metadataMap) {
      return metadataMap;
    }
    return null;
  }
  keys(): string[] {
    return Array.from(this.storage.keys());
  }
}

export default ReflectStorage;
