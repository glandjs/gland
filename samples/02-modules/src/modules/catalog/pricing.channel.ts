import { Channel, Module, On } from '@glandjs/common';
import type { CatalogItem } from './catalog.channel';

/** What pricing adds to an item, without knowing anything about storage. */
export interface PricedItem extends CatalogItem {
  finalPrice: number;
}

/**
 * The pricing rules.
 *
 * This channel is reached as `pricing:apply`. It knows the shape of a
 * catalogue item, but nothing about where items come from — that is the
 * direction the dependency runs, and it is the point.
 */
@Channel('pricing')
export class PricingChannel {
  /** Bulk orders get 10% off. A hard-coded rule, standing in for real logic. */
  @On('apply')
  apply(item: CatalogItem, quantity = 1): PricedItem {
    const discount = quantity >= 10 ? 0.9 : 1;
    return { ...item, finalPrice: Math.round(item.price * discount * 100) / 100 };
  }
}

/** Volume tiers, kept apart so the rule can be tested on its own. */
export const VOLUME_THRESHOLD = 10;
export const VOLUME_DISCOUNT = 0.9;
