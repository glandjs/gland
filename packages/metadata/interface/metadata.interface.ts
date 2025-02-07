import { MetadataKey, MetadataTarget, MetadataValue } from '../types/metadata.types';

// Define the MetadataStorage interface
export interface MetadataStorage<K extends MetadataKey, V extends MetadataValue> {
  get(target: MetadataTarget): Map<K, V>;

  set(target: MetadataTarget, key: K, value: V): void;

  has(target: MetadataTarget, key: K): boolean;

  delete(target: MetadataTarget, key: K): boolean;

  clear(target: MetadataTarget): void;

  keys(): string[];

  list(target: MetadataTarget): Map<K, V> | null;
}
