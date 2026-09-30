import { Module } from '@glandjs/common';
import type { IOEvent } from '@glandjs/events';
import { AuditChannel, type AuditEntry } from './modules/audit/audit.channel';
import { OrderController } from './modules/orders/order.controller';
import { OrderChannel, InventoryChannel } from './modules/orders/orders.channel';
import type { Order, PricedOrder } from './modules/orders/discount.policy';

/**
 * A module may hold several channels and a controller, and needs to declare
 * nothing to be reachable. What it declares is what gets instantiated and
 * bound.
 */
@Module({ controllers: [OrderController], channels: [OrderChannel, InventoryChannel] })
class OrdersModule {}

/** A separate module for a separate concern, imported once by the root. */
@Module({ channels: [AuditChannel] })
class AuditModule {}

/**
 * The application's entry module.
 *
 * Two features, named once. Everything below them is registered transitively,
 * so the root never mentions `OrderChannel`, `InventoryChannel` or
 * `AuditChannel` individually.
 */
@Module({
  imports: [OrdersModule, AuditModule],
})
class AppModule {}

/**
 * The event map.
 *
 * This is the contract between callers and channels, and the only place the
 * two sides have to agree. `IOEvent<Payload, Return>` makes `ctx.call` check
 * the payload you send and the value you get back.
 *
 * The keys are public event names: `namespace:event`, exactly as written at
 * the call site.
 */
export interface AppEvents {
  'orders:place': IOEvent<Omit<Order, 'id'>, Order>;
  'orders:find': IOEvent<string, Order | null>;
  'orders:price': IOEvent<string, PricedOrder | null>;
  'orders:clear': IOEvent<void, number>;
  'inventory:check': IOEvent<string, { sku: string; available: number }>;
  'inventory:reserve': IOEvent<{ sku: string; quantity?: number }, { reserved: boolean; available: number }>;
  'audit:record': IOEvent<Omit<AuditEntry, 'at'>, AuditEntry>;
  'audit:entries': IOEvent<void, AuditEntry[]>;
}

export { AppModule };
