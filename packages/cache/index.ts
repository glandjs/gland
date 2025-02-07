import { CacheConfig, Qiks } from '@medishn/qiks';
export class InMemoryCacheStore<K, V> extends Qiks<K, V> {
  constructor(option: CacheConfig<K, V>) {
    super(option);
  }
}
