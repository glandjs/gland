import { Injectable } from '@glandjs/common';

/** The order as it is stored: no money attached yet. */
export interface Order {
  id: string;
  customer: string;
  items: Array<{ sku: string; quantity: number; unitPrice: number }>;
}

/** What `orders:price` returns: the order, with money attached. */
export interface PricedOrder {
  orderId: string;
  subtotal: number;
  discount: number;
  total: number;
  discounted: boolean;
}

/** The total value of a basket, to the cent. */
export function subtotalOf(order: Order): number {
  const sum = order.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  return Math.round(sum * 100) / 100;
}

/**
 * Applies a discount to an order.
 *
 * A service rather than a channel: it holds a rule, not an event handler, and
 * nothing outside this class needs to reach it. It is injected into
 * `OrderChannel`, so the pricing logic can change without anything that
 * addresses an event moving.
 */
@Injectable()
export class DiscountPolicy {
  /** Orders above this subtotal get a percentage off. */
  static readonly THRESHOLD = 100;

  static readonly RATE = 0.15;

  /**
   * Counted rather than returned, because a notification has no value for a
   * caller. This is the shape of work `emit` exists for.
   */
  applied = 0;

  notify(): void {
    this.applied++;
  }

  /** Pure, so the channel can await it and hand the result back. */
  price(order: Order): PricedOrder {
    const subtotal = subtotalOf(order);
    const qualifies = subtotal > DiscountPolicy.THRESHOLD;
    const discount = qualifies ? Math.round(subtotal * DiscountPolicy.RATE * 100) / 100 : 0;

    return {
      orderId: order.id,
      subtotal,
      discount,
      total: Math.round((subtotal - discount) * 100) / 100,
      discounted: qualifies,
    };
  }
}
