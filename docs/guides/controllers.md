# Controllers

A controller exposes HTTP routes. It holds no routing logic itself — the
decorators declare intent and the binder publishes it to whichever adapter is
attached.

## Declaring

```ts
import { Controller } from '@glandjs/common';
import { Get, Post, Put, Patch, Delete, All, type Context } from '@glandjs/express';

@Controller('products')
export class ProductController {
  @Get()
  list(ctx: Context) {
    /* -> GET /products */
  }

  @Get(':id')
  find(ctx: Context) {
    /* -> GET /products/:id */
  }

  @Post()
  create(ctx: Context) {
    /* -> POST /products */
  }
}
```

`@Controller('products')` sets the prefix. The handler path is appended.

## Path composition

Both parts are normalised before joining, so the usual spellings all work:

| Controller     | Handler     | Result             |
| -------------- | ----------- | ------------------ |
| `'products'`   | `'/health'` | `/products/health` |
| `'/products/'` | `'/:id'`    | `/products/:id`    |
| `'products'`   | `'/'`       | `/products`        |
| `'/'`          | `'/health'` | `/health`          |
| _(none)_       | `'/health'` | `/health`          |

Duplicate slashes are collapsed and trailing slashes trimmed, on both sides.

## `this` is the controller

A handler runs with the controller instance as `this`, so instance state works:

```ts
@Controller('products')
export class ProductController {
  private readonly cache = new Map<string, Product>();

  @Get(':id')
  find(ctx: Context) {
    return this.cache.get(ctx.params.id);
  }
}
```

The handler is extracted as a bare prototype function during binding, so `this`
is restored explicitly at dispatch. Calling it without that would run with
`this === undefined`.

## The request context

`ctx` carries everything about the request. Beyond the transport-specific
accessors (`ctx.body`, `ctx.params`, `ctx.query`, `ctx.headers`, …), it provides:

| Member                            | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `ctx.call(event, data)`           | invoke a channel handler, return its value   |
| `ctx.emit(event, data)`           | invoke a channel handler, discard the value  |
| `ctx.state`                       | per-request scratch space; assignment merges |
| `ctx.setState(data)`              | the same, stated explicitly                  |
| `ctx.on` / `ctx.once` / `ctx.off` | subscribe to raw broker events               |

### `ctx.state`

```ts
ctx.state = { userId: 'u1' };
ctx.state = { requestId: 'r1' };
ctx.state; // { userId: 'u1', requestId: 'r1' } — merged, not replaced
```

The binder also publishes two reserved keys before your handler runs:

- `ctx.state.brokerId` — id of the core bus
- `ctx.state.channel` — the frozen `publicName -> brokerEvent` registry

Both are read-only in practice. The registry is shared by every request rather
than copied per request, so mutating it would corrupt the whole application.

## Injection

A controller's constructor is resolved by the container:

```ts
@Controller('products')
export class ProductController {
  constructor(private readonly store: ProductStore) {}
}
```

Controllers are already decorated, so `emitDecoratorMetadata` covers them and
no `@Injectable()` is needed.

## Calling channels

```ts
@Get(':id')
async find(ctx: Context<AppEvents>) {
  const product = await ctx.call('product:find', ctx.params.id);
  if (!product) return ctx.throw(404, { message: 'not found' });
  return product;
}
```

An unknown event name throws with the valid names listed, rather than returning
`undefined` — see [Channels](channels.md).

## Middleware

Middleware is adapter-level, not controller-level:

```ts
express.use((ctx, next) => {
  const started = Date.now();
  return next().finally(() => {
    logger.info(`${ctx.method} ${ctx.path} ${Date.now() - started}ms`);
  });
});
```

The adapter distinguishes a Gland middleware (`(ctx, next)`) from a native one
by arity, and passes the context accordingly. Write Gland middleware against
`ctx`; use `@Controller` only for routes.

## Route registration is a broadcast

Routes are not registered by the core calling into the adapter. The binder
broadcasts a `gland:define:route` payload carrying the handler, and adapters
subscribe:

```ts
this.broker.on('gland:define:route', (payload) => {
  this.instance[payload.method.toLowerCase()](payload.meta.path, payload.action);
});
```

That is the whole extension mechanism, and it is why the core has no HTTP code.
Adapters attaching after bootstrap receive the full route table through a
replay, so ordering between `create()` and `connectTo()` does not matter.
