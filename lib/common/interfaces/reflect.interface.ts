export type MetadataKey = string | symbol;
export type MetadataValue = any;
export type MetadataTarget = object | Function;

export interface MetadataStorage {
  get(target: MetadataTarget): Map<MetadataKey, MetadataValue>;
  set(target: MetadataTarget, key: MetadataKey, value: MetadataValue): void;
  has(target: MetadataTarget, key: MetadataKey): boolean;
  delete(target: MetadataTarget, key: MetadataKey): boolean;
}
