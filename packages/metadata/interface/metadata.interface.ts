import { MetadataKey, MetadataTarget, MetadataValue } from '../types/metadata.types';

export interface MetadataStorage {
  get<K extends MetadataKey, V>(target: MetadataTarget): Map<MetadataKey<K>, MetadataValue<V>>;
  set<K extends MetadataKey, V>(target: MetadataTarget, key: MetadataKey<K>, value: MetadataValue<V>): void;
  has(target: MetadataTarget, key: MetadataKey): boolean;
  delete(target: MetadataTarget, key: MetadataKey): boolean;
  clear(target: MetadataTarget): void;
  keys(): string[];
  list<K extends MetadataKey, V>(target: MetadataTarget): Map<MetadataKey<K>, MetadataValue<V>> | null;
}
