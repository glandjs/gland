# Gland

> What if every interaction was an event?

**Gland** is a progressive, event-driven framework for Node.js. It gives you
module composition and dependency injection in the NestJS idiom, and routes all
inter-component communication through a single message bus instead of a direct
call graph.

```ts
import { Module } from '@glandjs/common';
import { GlandFactory } from '@glandjs/core';
import { ExpressBroker } from '@glandjs/express';

@Module({ imports: [ProductModule] })
export class AppModule {}

const { app, shutdown } = await GlandFactory.create(AppModule);
const express = app.connectTo(ExpressBroker);

express.get('/health', (ctx) => ctx.send('ok'));
express.listen(3000);

process.on('SIGTERM', () => void shutdown('SIGTERM'));
```

---

## Packages

| Package                                                | Description                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| [`@glandjs/core`](packages/core)                       | Module registration, dependency injection, discovery, the broker, and lifecycle |
| [`@glandjs/common`](packages/common)                   | Decorators, metadata keys, event-name helpers, shared types                     |
| [`@glandjs/events`](https://github.com/glandjs/events) | The event broker: mesh, replication, request/response                           |
| [`@glandjs/http`](https://github.com/glandjs/http)     | Protocol-neutral HTTP layer                                                     |
| [`@glandjs/express`](https://github.com/glandjs/http)  | Express adapter                                                                 |

The transport packages live in separate repositories. This one holds the parts
that have no opinion about transport.

---

## Installation

```bash
npm install @glandjs/core @glandjs/common
# plus an adapter
npm install @glandjs/express
```

Requires **Node.js 20+**, **TypeScript 5+**, and these compiler options:

```jsonc
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  },
}
```

`emitDecoratorMetadata` is not optional. It is what lets the container discover
a provider's constructor parameters, and without it every dependency arrives as
`undefined`. See [Dependency injection](docs/guides/dependency-injection.md).

---

## Core concepts

### Modules

A module is a unit of composition. The tree is walked once at startup, and
everything reachable from the root is registered.

```ts
@Module({
  imports: [ProductModule],
  controllers: [ProductController],
  channels: [Database],
})
export class AppModule {}
```

### Controllers

A controller exposes HTTP routes. `@Controller('products')` sets the prefix;
`@Get()`, `@Post()` and friends (from `@glandjs/http`) declare the handlers.

```ts
@Controller('products')
export class ProductController {
  @Get(':id')
  async find(ctx: Context) {
    return ctx.call('db:product:find', ctx.params.id);
  }
}
```

### Channels

A channel is a named group of event handlers. `@Channel('db')` namespaces them,
`@On('product:find')` names one, and `ctx.call()` / `ctx.emit()` reach them.

```ts
@Channel('db')
export class Database {
  @On('product:find')
  find(id: string) {
    return this.products.get(id);
  }
}
```

### Channels instead of direct references

This is the part that differs from NestJS. A controller does not import the
service that holds the data; it _calls_ it by name.

```ts
// The controller knows nothing about Database's type or location.
const product = await ctx.call('db:product:find', id);
```

The cost is one string lookup. What you get back is that the controller, the
channel, and any future transport all reach each other through one bus, and
that the call is observable and interceptable without patching the callee.

### Adapters

The core knows nothing about HTTP, WebSockets, or queues. A protocol adapter
contributes its own broker, subscribes to the route broadcast, and returns an
application handle.

```ts
const express = app.connectTo(ExpressBroker);
const ws = app.connectTo(WebSocketBroker);
```

Both see the same channels. Neither is special.

---

## Documentation

| Section                                                     | Contents                                   |
| ----------------------------------------------------------- | ------------------------------------------ |
| [Getting started](docs/guides/getting-started.md)           | A working application, start to finish     |
| [Modules](docs/guides/modules.md)                           | Composition, dynamic modules, lazy imports |
| [Dependency injection](docs/guides/dependency-injection.md) | Resolution order, `@Injectable`, cycles    |
| [Channels](docs/guides/channels.md)                         | Addressing, naming rules, error handling   |
| [Controllers](docs/guides/controllers.md)                   | Routing and the request context            |
| [Lifecycle](docs/guides/lifecycle.md)                       | The five hooks and their order             |
| [Testing](docs/guides/testing.md)                           | Unit and integration patterns              |
| [Architecture](docs/architecture/README.md)                 | How the pieces fit together                |
| [Bootstrap sequence](docs/architecture/bootstrap.md)        | Exactly what happens at startup            |
| [API reference](docs/api/README.md)                         | Every public export                        |
| [Contributing](docs/development/CONTRIBUTING.md)            | Local setup and conventions                |

---

## Contributing

See [CONTRIBUTING.md](docs/development/CONTRIBUTING.md).

## License

[MIT](LICENSE)
