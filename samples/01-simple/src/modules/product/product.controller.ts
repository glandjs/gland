import { Controller } from '@glandjs/common';
import type { ExpressContext } from '@glandjs/express';
import { Get, Post } from '@glandjs/http';
import type { EventTypes } from '../../shared/events.interface';

@Controller('products')
export class ProductController {
  @Get()
  async getAllProducts(ctx: ExpressContext<EventTypes>) {
    const products = await ctx.call('db:product:all-products', {});
    return ctx.send({ products });
  }

  @Get(':id')
  async getProductById(ctx: ExpressContext<EventTypes>) {
    const { id } = ctx.params || {};
    ctx.emit('product:viewed', { id, ctx });

    return ctx.send({ params: ctx.params });
  }

  @Post()
  async createProduct(ctx: ExpressContext<EventTypes>) {
    const { name, price, stock } = ctx.body || {};

    if (!name || !price) {
      return ctx.send({ error: 'Name and price are required' }, 400);
    }

    const product = await ctx.call('db:product:create', { name, price, stock: stock || 0 });
    return ctx.send({ product }, 201);
  }
}
