# 01 — Simple

One controller, one channel, one typed event. The shape of every Gland
application.

```bash
pnpm install
pnpm dev
```

```
  [AppModule] Initialized
  [ProductModule] Initialized
[Database] onChannelInit
[Analytics] onChannelInit
  [ProductModule] Bootstrapped

POST /products
  created    -> {"product":{"id":"p1","name":"Widget","price":9.99,"stock":3},"status":201}

GET /products/:id
[Analytics] Product p1 viewed
  found      -> {"product":{"id":"p1",...}}

Validation and 404
  missing price -> {"error":"`name` (string) and `price` (number) are required","status":400}
  unknown id    -> {"error":"No product with id \"nope\"","status":404}
```

## The one thing to notice

`product.controller.ts` does not import `Database`. It has the event names, and
nothing else:

```ts
const product = await ctx.call('db:product:find', id);
ctx.emit('analytics:viewed', { id });
```

Both reach a channel. The first takes the value back; the second discards it,
because a line in a log has no result for the caller to wait on.

## Typed events

```ts
export interface EventTypes {
  'db:product:find': IOEvent<string, Product | null>;
  'db:product:create': IOEvent<Omit<Product, 'id'>, Product>;
  'db:product:all': IOEvent<Record<string, never>, Product[]>;
  'analytics:viewed': IOEvent<{ id: string }, void>;
}
```

`ctx.call('db:product:find', id)` is typed as `Product | null`, and a wrong
payload is a compile error. The event map is the whole contract between callers
and channels.

## Namespaces

`@Channel('db')` + `@On('product:find')` is addressed as `db:product:find`. The
namespace is part of the name, which is why a `db:product:find` and a future
`cache:product:find` could both exist without either shadowing the other.

## Modules

```
AppModule
├── DataModule          channels: [Database]
└── ProductModule       controllers: [ProductController]
                        channels: [AnalyticsChannel]
```

`AppModule` names two modules. Everything below them is registered
transitively, and every route and handler is discovered from decorator metadata.

## The three decorators, and nothing else

A method is a route because it carries `@Get()`. A method is a handler because
it carries `@On()`. Nothing is inferred from a naming convention, so renaming
cannot break a route and adding a method cannot accidentally create one.

## Files

| File                                        | Contents                                 |
| ------------------------------------------- | ---------------------------------------- |
| `src/main.ts`                               | Boot, then drive the controller          |
| `src/app.module.ts`                         | The entry module and the product feature |
| `src/common/data.module.ts`                 | The data layer                           |
| `src/common/db.channel.ts`                  | `db:product:*` handlers                  |
| `src/modules/product/product.controller.ts` | Routes that call channels by name        |
| `src/modules/product/analytics.channel.ts`  | A side-effect-only channel               |
| `src/shared/events.interface.ts`            | The event map                            |

The controller writes its own `Get()`/`Post()` against the metadata keys rather
than importing them from `@glandjs/http`, which lets this sample depend on
`@glandjs/core` alone.
