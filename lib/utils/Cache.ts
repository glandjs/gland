import { Qiks } from '@medishn/qiks';
import { CacheConfigQiks } from '@medishn/qiks/dist/types/CacheTypes';
export class QiksCache<K, V> extends Qiks<K, V> {
  constructor(options?: CacheConfigQiks<K>) {
    super(options);
  }
}
