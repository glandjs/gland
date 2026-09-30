# Getting started

A complete Gland application, from an empty directory to a running server.

## 1. Install

```bash
npm install @glandjs/core @glandjs/common @glandjs/express
```

Requires Node.js 20+ and TypeScript 5+.

## 2. Configure TypeScript

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "skipLibCheck": true,
  },
}
```

`emitDecoratorMetadata` is **required**. It is how the container learns a
provider's constructor parameters; without it every dependency arrives as
`undefined`. See [Dependency injection](dependency-injection.md).

## 3. A channel

```ts
// src/products/product.channel.ts
import { Channel, On } from '@glandjs/common';
import type { Product } from './product';

const products = new Map<string, Product>();
let nextId = 1;

@Channel('product')
export class ProductStore {
  @On('find')
  find(id: string): Product | null {
    return products.get(id) ?? null;
  }

  @On('create')
  create(input: Omit<Product, 'id'>): Product {
    const product = { id: `p${nextId++}`, ...input };
    products.set(product.id, product);
    return product;
  }

  @On('all')
  all(): Product[] {
    return [...products.values()];
  }
}
```

## 4. A controller

```ts
// src/products/product.controller.ts
import { Controller } from '@glandjs/common';
import { Get, Post, type Context } from '@glandjs/express';

@Controller('products')
export class ProductController {
  @Get()
  list(ctx: Context) {
    return ctx.call('product:all', {});
  }

  @Get(':id')
  find(ctx: Context) {
    return ctx.call('product:find', ctx.params.id);
  }

  @Post()
  create(ctx: Context) {
    const { name, price } = ctx.body ?? {};
    if (!name || price === undefined) {
      return ctx.throw(400, { message: 'name and price are required' });
    }
    return ctx.call('product:create', { name, price });
  }
}
```

The controller never imports `ProductStore`. It calls it by name.

## 5. A module

```ts
// src/products/product.module.ts
import { Module } from '@glandjs/common';
import { ProductController } from './product.controller';
import { ProductStore } from './product.channel';

@Module({
  controllers: [ProductController],
  channels: [ProductStore],
})
export class ProductModule {}
```

```ts
// src/app.module.ts
import { Module } from '@glandjs/common';
import { ProductModule } from './products/product.module';

@Module({ imports: [ProductModule] })
export class AppModule {}
```

## 6. Bootstrap

```ts
// src/main.ts
import { GlandFactory } from '@glandjs/core';
import { ExpressBroker } from '@glandjs/express';
import { AppModule } from './app.module';

async function main() {
  const { app, shutdown } = await GlandFactory.create(AppModule);

  const express = app.connectTo(ExpressBroker);
  express.json();
  express.listen(3000);

  const stop = async (signal: string) => {
    await shutdown(signal);
    await express.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void stop('SIGTERM'));
  process.on('SIGINT', () => void stop('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});
```

`GlandFactory.create()` resolves only once binding is complete, so `listen()` on
the next line cannot race route registration.

## 7. Run

```bash
npx ts-node src/main.ts
```

```bash
$ curl localhost:3000/products -X POST -d '{"name":"Widget","price":9.99}' -H 'content-type: application/json'
{"id":"p1","name":"Widget","price":9.99}

$ curl localhost:3000/products
[{"id":"p1","name":"Widget","price":9.99}]

$ curl localhost:3000/products/p1
{"id":"p1","name":"Widget","price":9.99}
```

## Typed events

Give the context an event map so payloads and return values are checked:

```ts
// src/events.ts
import type { IOEvent } from '@glandjs/events';
import type { Product } from './products/product';

export interface AppEvents {
  'product:find': IOEvent<string, Product | null>;
  'product:create': IOEvent<Omit<Product, 'id'>, Product>;
  'product:all': IOEvent<Record<string, never>, Product[]>;
}
```

```ts
@Controller('products')
export class ProductController {
  @Get(':id')
  find(ctx: Context<AppEvents>) {
    return ctx.call('product:find', ctx.params.id); // typed as Product | null
  }
}
```

## Debugging

Set `GLAND_DEBUG=true` for verbose internal logging — module registration,
provider resolution, binding, and lifecycle phases:

```bash
GLAND_DEBUG=true npx ts-node src/main.ts
```

A failing bootstrap throws with the underlying cause intact, so a stack trace
from `main()`'s `catch` shows where it actually broke.

## Next

| Guide                                           | Covers                                     |
| ----------------------------------------------- | ------------------------------------------ |
| [Modules](modules.md)                           | Composition, dynamic modules, lazy imports |
| [Dependency injection](dependency-injection.md) | `@Injectable`, `@Inject`, cycles           |
| [Channels](channels.md)                         | Addressing, naming, typed events           |
| [Controllers](controllers.md)                   | Routing and the request context            |
| [Lifecycle](lifecycle.md)                       | The five hooks                             |
| [Testing](testing.md)                           | Unit and integration patterns              |
