import { MetadataKey, MetadataTarget, MetadataValue } from '../types/metadata.types';

export interface MetadataStorage {
  get(target: MetadataTarget): Map<MetadataKey, MetadataValue>;
  set(target: MetadataTarget, key: MetadataKey, value: MetadataValue): void;
  has(target: MetadataTarget, key: MetadataKey): boolean;
  delete(target: MetadataTarget, key: MetadataKey): boolean;
  clear(target: MetadataTarget): void;
  keys(): string[];
  list(target: MetadataTarget): Map<MetadataKey, MetadataValue> | null;
  allList(): Map<string, Map<MetadataKey, MetadataValue>>;
}