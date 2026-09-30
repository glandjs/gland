import { Controller } from '@glandjs/common';
import type { Context } from '@glandjs/core';
import type { EventTypes } from '../../shared/events.interface';

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

export type DemoContext = Context<EventTypes> & DemoRequest;

/** The body `POST /products` expects. */
type NewProduct = { name: string; price: number; stock?: number };

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
 * HTTP routes for the product catalogue.
 *
 * Note what is *not* imported here: `Database`. The handlers reach it by name
 * through `ctx.call()`, which is what keeps the controller free of any
 * knowledge about where the data lives.
 *
 * The event map types both directions, so `ctx.call('db:product:find', id)`
 * returns a `Product | null` and a wrong payload is a compile error.
 */
@Controller('products')
export class ProductController {
  /** `GET /products` */
  @Get()
  async list(ctx: DemoContext) {
    const products = await ctx.call('db:product:all', {});
    return { products };
  }

  /** `GET /products/:id` */
  @Get(':id')
  async find(ctx: DemoContext) {
    const { id } = ctx.params;
    const product = await ctx.call('db:product:find', id);

    if (!product) {
      return { error: `No product with id "${id}"` as const, status: 404 as const };
    }

    // Fire-and-forget: the handler's return value is discarded. Use `call` when
    // you need what comes back, `emit` for side effects.
    ctx.emit('analytics:viewed', { id });

    return { product };
  }

  /** `POST /products` */
  @Post()
  async create(ctx: DemoContext) {
    // A real adapter would have parsed and validated the body, so the cast is
    // something the transport does for you rather than something every
    // controller repeats.
    const { name, price, stock } = (ctx.body ?? {}) as Partial<NewProduct>;
    if (typeof name !== 'string' || typeof price !== 'number') {
      return { error: '`name` (string) and `price` (number) are required' as const, status: 400 as const };
    }

    const product = await ctx.call('db:product:create', { name, price, stock: stock ?? 0 });
    return { product, status: 201 as const };
  }
}
