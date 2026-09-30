import { Channel, Module, On } from '@glandjs/common';

/** A product in the catalogue. */
export interface CatalogItem {
  sku: string;
  title: string;
  price: number;
}

const items: CatalogItem[] = [
  { sku: 'KBD-01', title: 'Mechanical keyboard', price: 140 },
  { sku: 'MON-27', title: '27" display', price: 420 },
];

/**
 * The catalogue itself.
 *
 * Addressed as `catalog:list` and `catalog:find`, because `@Channel('catalog')`
 * namespaces every `@On()` declared inside it.
 */
@Channel('catalog')
export class CatalogChannel {
  onModuleInit(): void {
    console.log('[CatalogChannel] onModuleInit');
  }

  @On('list')
  list(): CatalogItem[] {
    return items;
  }

  @On('find')
  find(sku: string): CatalogItem | null {
    return items.find((item) => item.sku === sku) ?? null;
  }
}
