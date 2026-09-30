import { Controller } from '@glandjs/common';
import { Get, Post, type ExpressContext } from '@glandjs/express';
import type { EventTypes } from '../../shared/events.interface';

/**
 * HTTP routes for the product catalogue.
 *
 * Note what is *not* imported here: `Database`. The handlers reach it by name
 * through `ctx.call()`, which is what keeps the controller free of any
 * knowledge about where the data lives.
 */
@Controller('products')
export class ProductController {
  /** `GET /products` */
  @Get()
  async list(ctx: ExpressContext<EventTypes>) {
    const products = await ctx.call('db:product:all', {});
    return ctx.send({ products });
  }

  /** `GET /products/:id` */
  @Get(':id')
  async find(ctx: ExpressContext<EventTypes>) {
    const { id } = ctx.params;
    const product = await ctx.call('db:product:find', id);

    if (!product) {
      return ctx.throw(404, { message: `No product with id "${id}"` });
    }

    // Fire-and-forget: the handler's return value is discarded.
    ctx.emit('analytics:viewed', { id });

    return ctx.send({ product });
  }

  /** `POST /products` */
  @Post()
  async create(ctx: ExpressContext<EventTypes>) {
    const { name, price, stock } = ctx.body ?? {};

    if (!name || price === undefined) {
      return ctx.throw(400, { message: '`name` and `price` are required' });
    }

    const product = await ctx.call('db:product:create', { name, price, stock: stock ?? 0 });
    return ctx.send({ product }, 201);
  }
}
