import { Qiks } from '@medishn/qiks';
import { CacheConfigQiks } from '@medishn/qiks/dist/types/CacheTypes';

/**
 * A caching system built on top of @medishn/qiks.
 */
export class MemoryCacheStore<K, V> extends Qiks<K, V> {
  constructor(options?: CacheConfigQiks<K>) {
    super(options);
  }
}
