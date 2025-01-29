import { isClass } from '@gland/common/utils';
import { MemoryCacheStore } from '@gland/cache';
import { MetadataStorage } from '../interface/metadata.interface';
import { MetadataKey, MetadataTarget, MetadataValue } from '../types/metadata.types';

class ReflectStorage implements MetadataStorage {
  private storage = new MemoryCacheStore<string, Map<MetadataKey, MetadataValue>>();
  constructor() {
    this.storage = new MemoryCacheStore({
      policy: 'LRU',
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

  private ensureMetadataMap(target: MetadataTarget): Map<MetadataKey, MetadataValue> {
    const targetKey = this.getTargetIdentifier(target);
    let metadataMap = this.storage.get(targetKey);
    if (!(metadataMap instanceof Map)) {
      metadataMap = new Map<MetadataKey, MetadataValue>();
      this.storage.set(targetKey, metadataMap);
    }
    return metadataMap;
  }
  get(target: MetadataTarget): Map<MetadataKey, MetadataValue> {
    const targetKey = this.getTargetIdentifier(target);
    const metadataMap = this.storage.get(targetKey);
    return metadataMap instanceof Map ? metadataMap : new Map<MetadataKey, MetadataValue>();
  }

  set(target: MetadataTarget, key: MetadataKey, value: MetadataValue): void {
    const metadataMap = this.ensureMetadataMap(target);
    metadataMap.set(key, value);
    const targetKey = this.getTargetIdentifier(target);
    this.storage.set(targetKey, metadataMap);
  }

  has(target: MetadataTarget, key: MetadataKey): boolean {
    const metadataMap = this.get(target);
    return metadataMap.has(key);
  }

  delete(target: MetadataTarget, key: MetadataKey): boolean {
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

  list(target: MetadataTarget): Map<MetadataKey, MetadataValue> | null {
    const targetKey = this.getTargetIdentifier(target);
    const metadataMap = this.storage.get(targetKey);
    if (metadataMap instanceof Map) {
      return metadataMap;
    }
    return null;
  }
  keys(): string[] {
    return Array.from(this.storage.keys());
  }

  allList(): Map<string, Map<MetadataKey, MetadataValue>> {
    const entries = this.storage.get('*', { pattern: true, withTuples: true }) as [string, Map<MetadataKey, MetadataValue>][];
    const allMetadata = new Map<string, Map<MetadataKey, MetadataValue>>();

    for (const [key, value] of entries) {
      if (value instanceof Map) {
        allMetadata.set(key, value);
      }
    }
    return allMetadata;
  }
}

export default ReflectStorage;
