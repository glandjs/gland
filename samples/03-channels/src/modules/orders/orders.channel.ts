import { Channel, On } from '@glandjs/common';
import type { OnChannelInit } from '@glandjs/core';
import { DiscountPolicy } from './discount.policy';
import type { Order, PricedOrder } from './discount.policy';

const orders = new Map<string, Order>();
let sequence = 0;

/**
 * Orders, addressed as `orders:*`.
 *
 * Three things worth noticing:
 *
 * - the namespace is the first segment of the event name, so `orders:find` and
 *   a `catalog:find` are different events even though both end in "find"
 * - the injected {@link DiscountPolicy} is a service, not a channel. Rules
 *   belong in classes the container builds; only things something else must
 *   *address* need a namespace
 * - `onChannelInit` runs after binding, so it can rely on every channel in the
 *   application being reachable
 */
@Channel('orders')
export class OrderChannel implements OnChannelInit {
  constructor(private readonly discounts: DiscountPolicy) {}

  onChannelInit(): void {
    console.log('[OrderChannel] onChannelInit — every channel is bound by now');
  }

  @On('place')
  place(input: Omit<Order, 'id'>): Order {
    const order: Order = { id: `o${++sequence}`, ...input };
    orders.set(order.id, order);
    console.log(`  [OrderChannel] stored ${order.id} for ${order.customer}`);

    // Fire-and-forget toward our own service. We already know the result, so
    // there is nothing to return: `emit` is for side effects, `call` is for
    // values.
    this.discounts.notify();

    return order;
  }

  @On('find')
  find(id: string): Order | null {
    return orders.get(id) ?? null;
  }

  /**
   * The request/response case: the caller needs the value back.
   *
   * The handler is async, and `ctx.call` unwraps the promise, so the caller
   * awaits the value rather than a promise of a value.
   */
  @On('price')
  async price(id: string): Promise<PricedOrder | null> {
    const order = orders.get(id);
    return order ? this.discounts.price(order) : null;
  }

  @On('clear')
  clear(): number {
    const count = orders.size;
    orders.clear();
    return count;
  }
}

/**
 * A second channel in the same module.
 *
 * Nothing declares a dependency on it. It is reachable because it declares a
 * namespace, and that is the whole contract.
 */
@Channel('inventory')
export class InventoryChannel {
  private readonly stock = new Map<string, number>([
    ['KBD-01', 12],
    ['MON-27', 3],
  ]);

  @On('check')
  check(sku: string): { sku: string; available: number } {
    return { sku, available: this.stock.get(sku) ?? 0 };
  }

  /**
   * Reserves stock.
   *
   * Takes a single object rather than two positional arguments. `ctx.call`
   * passes exactly one payload, and a handler written against two positional
   * parameters would silently receive `undefined` for the second — a shape
   * that reads fine and fails at runtime.
   */
  @On('reserve')
  reserve(input: { sku: string; quantity?: number }): { reserved: boolean; available: number } {
    const quantity = input.quantity ?? 1;
    const available = this.stock.get(input.sku) ?? 0;

    if (quantity > available) {
      return { reserved: false, available };
    }

    this.stock.set(input.sku, available - quantity);
    return { reserved: true, available: available - quantity };
  }
}
