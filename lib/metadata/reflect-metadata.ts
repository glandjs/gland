import { isClass } from '../utils';
import { QiksCache } from '../utils/Cache';
import { MetadataKey, MetadataStorage, MetadataTarget, MetadataValue } from './Reflect.interface';

class ReflectMetadataStorage implements MetadataStorage {
  private storage = new QiksCache<string, Map<MetadataKey, MetadataValue>>();
  constructor() {
    this.storage = new QiksCache({
      policy: 'LRU',
    });
  }
  private serializeTarget(target: MetadataTarget): string {
    if (typeof target === 'function') {
      return isClass(target) ? `class:${target.name}` : `function:${target.name}`;
    }
    return `object:${JSON.stringify(target, this.replacer, 2)}`;
  }

  private replacer(key: string, value: any): any {
    if (typeof value === 'function') {
      return isClass(value) ? `class:${value.name}` : `function:${value.name}`;
    }
    return value;
  }

  private ensureMetadataMap(target: MetadataTarget): Map<MetadataKey, MetadataValue> {
    const serializedTarget = this.serializeTarget(target);
    let metadataMap = this.storage.get(serializedTarget);
    if (!(metadataMap instanceof Map)) {
      metadataMap = new Map<MetadataKey, MetadataValue>();
      this.storage.set(serializedTarget, metadataMap);
    }
    return metadataMap;
  }
  get(target: MetadataTarget): Map<MetadataKey, MetadataValue> {
    const serializedTarget = this.serializeTarget(target);
    const metadataMap = this.storage.get(serializedTarget);
    return metadataMap instanceof Map ? metadataMap : new Map<MetadataKey, MetadataValue>();
  }

  set(target: MetadataTarget, key: MetadataKey, value: MetadataValue): void {
    const metadataMap = this.ensureMetadataMap(target);
    metadataMap.set(key, value);
    const serializedTarget = this.serializeTarget(target);
    this.storage.delete(serializedTarget);
    this.storage.set(serializedTarget, metadataMap);
  }

  has(target: MetadataTarget, key: MetadataKey): boolean {
    const metadataMap = this.get(target);
    return metadataMap.has(key);
  }

  delete(target: MetadataTarget, key: MetadataKey): boolean {
    const serializedTarget = this.serializeTarget(target);
    const metadataMap = this.get(target);

    const result = metadataMap.delete(key);
    if (metadataMap.size === 0) {
      this.storage.delete(serializedTarget);
    } else {
      this.storage.set(serializedTarget, metadataMap);
    }

    return result;
  }
  clear(target: MetadataTarget): void {
    const serializedTarget = this.serializeTarget(target);
    this.storage.delete(serializedTarget);
  }

  list(target: MetadataTarget): Map<MetadataKey, MetadataValue> | null {
    const serializedTarget = this.serializeTarget(target);
    const metadataMap = this.storage.get(serializedTarget);
    if (metadataMap instanceof Map) {
      return metadataMap;
    }
    return null;
  }
}

export default new ReflectMetadataStorage();
