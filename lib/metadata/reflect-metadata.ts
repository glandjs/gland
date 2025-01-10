import { RouterMetadataKeys } from '../common/constants';
import { RouteDefinition } from '../common/interface/router.interface';
import { isClass } from '../utils';
import { MemoryCacheStore } from '../utils/Cache';
import { MetadataKey, MetadataStorage, MetadataTarget, MetadataValue } from './Reflect.interface';

class ReflectStorage implements MetadataStorage {
  private storage = new MemoryCacheStore<string, Map<MetadataKey, MetadataValue>>();
  constructor() {
    this.storage = new MemoryCacheStore({
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
  keys(): string[] {
    return Array.from(this.storage.keys());
  }
  getRoutes(): RouteDefinition[] {
    const allMetadata = this.allList();
    const routes: RouteDefinition[] = [];

    for (const [_, metadataMap] of allMetadata) {
      const controllerRoutes = metadataMap.get(RouterMetadataKeys.ROUTES);
      if (Array.isArray(controllerRoutes)) {
        routes.push(...controllerRoutes);
      }
    }

    return routes;
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

export default new ReflectStorage();
