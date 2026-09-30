import { Controller } from '@glandjs/common';
import type { Context } from '@glandjs/core';
import type { AppEvents } from '../../app.module';
import type { PricedOrder } from './discount.policy';

/**
 * A minimal context, standing in for `@glandjs/express`.
 *
 * This sample depends on `@glandjs/core` alone, so it supplies the one thing
 * the framework leaves to the adapter: the parsed request.
 */
export interface DemoRequest {
  params: Record<string, string>;
  body?: Record<string, unknown>;
}

export type DemoContext = Context<AppEvents> & DemoRequest;

/** Stands in for `@Get()` from `@glandjs/http`, written against the metadata keys. */
function Get(path = '/'): MethodDecorator {
  return (target: object, key: string | symbol) => {
    const method = (target as Record<string, (...a: unknown[]) => unknown>)[key as string];
    Reflect.defineMetadata('path', path, method);
    Reflect.defineMetadata('method', 'GET', method);
  };
}

/** Stands in for `@Post()`. */
function Post(path = '/'): MethodDecorator {
  return (target: object, key: string | symbol) => {
    const method = (target as Record<string, (...a: unknown[]) => unknown>)[key as string];
    Reflect.defineMetadata('path', path, method);
    Reflect.defineMetadata('method', 'POST', method);
  };
}

/**
 * The order API, addressed over HTTP in a real application.
 *
 * Look at what is *not* imported: neither `OrderChannel` nor `AuditChannel`.
 * Every interaction is by name. This controller would work identically over a
 * WebSocket, a queue consumer, or a CLI, with no change here.
 */
@Controller('orders')
export class OrderController {
  /** `POST /orders` */
  @Post()
  async place(ctx: DemoContext) {
    // The event map types both directions: this payload must match
    // `Omit<Order, 'id'>` and the result is an `Order`, not an unknown.
    const order = await ctx.call('orders:place', (ctx.body ?? {}) as NewOrder);

    // Fire-and-forget toward a module that has no idea this controller exists.
    // If the audit module were deleted, this line would find no listener and
    // the rest of the handler would be unaffected.
    ctx.emit('audit:record', { action: 'order.placed', detail: `${order.id} for ${order.customer}` });

    return { order };
  }

  /** `GET /orders/:id` */
  @Get(':id')
  async find(ctx: DemoContext) {
    return { order: await ctx.call('orders:find', ctx.params.id) };
  }

  /** `GET /orders/:id/price` */
  @Get(':id/price')
  async price(ctx: DemoContext): Promise<{ priced: PricedOrder } | { error: string }> {
    const priced = await ctx.call('orders:price', ctx.params.id);
    if (!priced) return { error: 'not found' };

    ctx.emit('audit:record', { action: 'order.priced', detail: `${priced.orderId} total ${priced.total}` });
    return { priced };
  }

  /**
   * `POST /inventory/:sku/reserve`
   *
   * Two channels, two calls, no imports between them. The inventory module
   * knows nothing about orders, and this controller knows nothing about how
   * stock is stored.
   */
  @Post(':sku/reserve')
  async reserve(ctx: DemoContext) {
    // `ctx.call` passes exactly one payload, so the channel takes an object
    // rather than positional arguments. `quantity` is not in the path, so it
    // comes from the body — the usual split: params from the route, body from
    // the request.
    const sku = ctx.params.sku;
    const quantity = Number(ctx.body?.quantity ?? 1);

    const result = await ctx.call('inventory:reserve', { sku, quantity });
    if (!result.reserved) {
      return { reserved: false as const, reason: `insufficient stock for ${sku}`, available: result.available };
    }
    return { reserved: true as const, sku, quantity, available: result.available };
  }
}

/** The body `POST /orders` expects, named so the cast above reads clearly. */
type NewOrder = { customer: string; items: Array<{ sku: string; quantity: number; unitPrice: number }> };
