# Sample 01 — simple

A small Gland application: one controller, two channels, typed events, and a
full lifecycle.

```
src/
  main.ts                          bootstrap
  app.module.ts                    entry module
  common/
    data.module.ts                 the data layer
    db.channel.ts                  db:product:* handlers
  modules/product/
    product.module.ts              the feature
    product.controller.ts          HTTP routes
    analytics.channel.ts           analytics:viewed
  shared/
    product.ts                     the Product type
    events.interface.ts            the event map
```

## What it shows

**Controllers reach channels by name.** `product.controller.ts` does not import
`Database`. It calls `ctx.call('db:product:find', id)`.

**Events are typed.** `EventTypes` is the context's event map, so payloads and
return values are checked at compile time:

```ts
const product = await ctx.call('db:product:find', id); // Product | null
ctx.call('db:product:find', { wrong: true }); // compile error
```

**`emit` and `call` differ only in the result.** `ctx.emit('analytics:viewed', …)`
invokes the handler and discards its return; `ctx.call(…)` hands it back.

**Lifecycle hooks are visible.** Every module logs from `onModuleInit`,
`onAppBootstrap` and `onAppShutdown`, so the ordering in the
[architecture docs](../../docs/architecture/bootstrap.md) is observable in the
output.

## Try it

```bash
pnpm install
pnpm start
```

```bash
curl localhost:3000/products -X POST \
  -H 'content-type: application/json' \
  -d '{"name":"Widget","price":9.99}'
# {"product":{"id":"p1","name":"Widget","price":9.99,"stock":0}}

curl localhost:3000/products
# {"products":[{"id":"p1",...}]}

curl localhost:3000/products/p1
# {"product":{"id":"p1",...}}   and "Product p1 viewed" in the server log

curl localhost:3000/products/nope
# 404 with a problem-details body
```

Set `GLAND_DEBUG=true` for verbose bootstrap logging.

## A note on the adapter

This sample imports `@glandjs/express`, which lives in the separate
[glandjs/http](https://github.com/glandjs/http) repository and is currently
released against the previous core API. For that reason `samples/` is excluded
from the root `pnpm typecheck` — the core and its own suites are typechecked
there, and this sample typechecks once the adapter is updated to the new
`BrokerAdapter` signature.

The core-facing code here is current: it uses `GlandFactory.create()` returning
`{ app, shutdown }`, and a `BrokerAdapter` whose `broker` is a declared abstract
member.
