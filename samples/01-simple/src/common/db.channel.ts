import { Channel, On } from '@glandjs/common';
import type { OnChannelInit } from '@glandjs/core';
import type { Product } from '../shared/events.interface';

const products = new Map<string, Product>();
let nextId = 1;

/**
 * An in-memory product store, addressed as `db:product:*`.
 *
 * The controller never imports this class — it calls it by name. That is what
 * lets the same handlers serve HTTP today and a different transport later.
 */
@Channel('db')
export class Database implements OnChannelInit {
  onChannelInit(): void {
    console.log('[Database] onChannelInit');
  }

  @On('product:create')
  createProduct(input: Omit<Product, 'id'>): Product {
    const product: Product = { id: `p${nextId++}`, ...input };
    products.set(product.id, product);
    return product;
  }

  @On('product:find')
  findProduct(id: string): Product | null {
    return products.get(id) ?? null;
  }

  @On('product:all')
  allProducts(): Product[] {
    return Array.from(products.values());
  }
}
