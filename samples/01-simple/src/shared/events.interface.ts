import type { ExpressContext } from '@glandjs/express';
import { IOEvent } from '@glandjs/events';
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface EventTypes {
  // Product events
  'product:viewed': { id: string; ctx: ExpressContext<EventTypes> };

  /// database events \\

  'db:product:create': IOEvent<Omit<Product, 'id'>, Promise<Product>>;
  'db:product:all-products': IOEvent<{}, Promise<Product[]>>;
}
