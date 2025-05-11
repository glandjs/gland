import { Channel, On } from '@glandjs/common';
import type { OnChannelInit } from '@glandjs/core';
import type { Product } from '../shared/events.interface';

@Channel('db')
export class Database implements OnChannelInit {
  onChannelInit(): void {
    console.log('[DatabaseChannel] Channel initialized');
  }
  private products: Map<string, Product> = new Map();
  @On('product:create')
  createProduct(product: Omit<Product, 'id'>): Product {
    const id = Math.random().toString(36).substring(2, 9);
    const newProduct = { id, ...product };
    this.products.set(id, newProduct);

    return newProduct || {};
  }

  @On('product:all-products')
  async getAllProducts(): Promise<Product[]> {
    const result = Array.from(this.products.values());
    return result;
  }
}
