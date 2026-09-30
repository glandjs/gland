<p align="center">
  <a href="#" target="_blank"><img src="https://github.com/glandjs/glandjs.github.io/blob/main/public/logo.png" width="200" alt="Gland Logo" /></a>
</p>

<p align="center">
  <a href="https://npmjs.com/package/@glandjs/core" target="_blank"><img src="https://img.shields.io/npm/v/@glandjs/core.svg" alt="NPM Version" /></a>
  <a href="https://npmjs.com/package/@glandjs/core" target="_blank"><img src="https://img.shields.io/npm/l/@glandjs/core.svg" alt="Package License" /></a>
  <a href="https://npmjs.com/package/@glandjs/core" target="_blank"><img src="https://img.shields.io/npm/dm/@glandjs/core.svg" alt="NPM Downloads" /></a>
</p>

<h1 align="center">Gland</h1>

<p align="center">A progressive, event-driven Node.js framework for building efficient and scalable server-side applications.</p>

## Description

> What if every interaction was an event? Welcome to Gland.

**Gland** is a lightweight, extensible web framework built for modern JavaScript and TypeScript applications. With its unique event-driven architecture (EDS), it offers unparalleled flexibility in creating modular, scalable server-side applications.

Inspired by frameworks like Angular and NestJS, Gland integrates an object-oriented design pattern, minimalistic dependency injection (DI), and powerful event-driven communication, allowing developers to efficiently build and maintain complex applications.

```ts
import { Controller, Module } from '@glandjs/common';
import { GlandFactory } from '@glandjs/core';
import { Get } from '@glandjs/http';

@Controller('products')
export class ProductController {
  @Get()
  list(ctx) {
    return ctx.call('db:product:all', {});
  }
}

@Module({ controllers: [ProductController] })
export class AppModule {}

const { app, shutdown } = await GlandFactory.create(AppModule);
app.connectTo(ExpressBroker).listen(3000);
```

That `ctx.call('db:product:all', {})` is the whole idea. The controller never imports
the thing that stores the products. It asks for them by name, and the message
bus delivers it. Swap the store, the transport, or the process boundary, and the
controller does not change.

## Philosophy

Rather than relying on predefined conventions or imposing rigid structures, Gland offers an approach where the developer can focus on the core problem domain without being hindered by unnecessary constraints. By using an event-driven approach, Gland ensures that communication between components remains straightforward and flexible, while also maintaining the ability to easily extend the system as requirements evolve.

The simplicity of Gland lies not in the absence of features, but in how it allows developers to shape their applications with minimal friction and clear intentions. It strives to be a framework that adapts to the developer's needs, not the other way around. Through this approach, Gland provides the foundation for building applications that are both effective and maintainable, without forcing an unnatural design pattern upon the developer.

Three commitments follow from that, and each of them cost something:

**Metadata is the only coupling.** Nothing is wired by hand, and nothing is
guessed from a naming convention. A method is a route because it carries `@Get()`,
not because it is called `get`. Renaming cannot break a route, and adding a
method cannot accidentally create one.

**The framework fails loudly.** A dependency cycle raises an error naming the
whole chain. An interface parameter raises an error explaining that
`emitDecoratorMetadata` was not enabled. A misspelled event raises an error
listing the events that do exist. A container that quietly hands over `undefined`
is worse than no container at all, because the failure surfaces somewhere
unrelated, hours later.

**An unhandled rejection is your bug, not our reason to exit.** A signal means
shutting down. A stray promise does not. Gland reports the second and honours
the first, and leaves the policy to you.

## Why Gland?

Gland is designed with flexibility and scalability in mind. Whether you're building small APIs or large-scale applications, Gland provides the tools to help you structure your codebase efficiently and maintainably. Its event-driven approach helps in decoupling components and improving testability, while its object-oriented philosophy ensures clear and consistent code organization.

The extension seam is deliberately narrow. The core publishes every route as a
broadcast, and a protocol adapter subscribes:

```ts
this.broker.on('gland:define:route', (route) => {
  this.instance[route.method.toLowerCase()](route.fullPath, route.action);
});
```

That is an entire adapter. `@glandjs/express` and `@glandjs/http` are built this
way, and so could be a WebSocket server, a queue consumer, or a CLI.

## Installation

```bash
npm install @glandjs/core @glandjs/common
npm install @glandjs/express    # or any other adapter
```

Node.js 20+, TypeScript 5+, and these two compiler options:

```jsonc
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  },
}
```

`emitDecoratorMetadata` is not optional. It is how the container learns what to
inject, and it is only emitted for classes that carry a decorator. Any service
the container constructs needs `@Injectable()`.

## Documentation

|                                                             |                                                   |
| ----------------------------------------------------------- | ------------------------------------------------- |
| [Getting started](docs/guides/getting-started.md)           | A working application, start to finish            |
| [Modules](docs/guides/modules.md)                           | Composition, dynamic modules, lazy imports        |
| [Dependency injection](docs/guides/dependency-injection.md) | Resolution order, cycles, and why it fails loudly |
| [Channels](docs/guides/channels.md)                         | Addressing, naming rules, typed events            |
| [Controllers](docs/guides/controllers.md)                   | Routing and the request context                   |
| [Lifecycle](docs/guides/lifecycle.md)                       | The five hooks and their order                    |
| [Testing](docs/guides/testing.md)                           | Unit and integration patterns                     |
| [Architecture](docs/architecture/README.md)                 | The ideas the framework is built from             |
| [Bootstrap sequence](docs/architecture/bootstrap.md)        | Exactly what happens at startup                   |
| [API reference](docs/api/README.md)                         | Every public export                               |
| [Samples](samples/README.md)                                | Runnable examples, one idea each                  |
| [Changelog](docs/CHANGELOG.md)                              | What changed, and what to do about it             |

## Packages

| Package                                                | Description                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| [`@glandjs/core`](packages/core)                       | Module registration, dependency injection, discovery, the bus, lifecycle |
| [`@glandjs/common`](packages/common)                   | Decorators, metadata keys, event-name helpers, shared types              |
| [`@glandjs/events`](https://github.com/glandjs/events) | The event broker: mesh, replication, request/response                    |
| [`@glandjs/http`](https://github.com/glandjs/http)     | Protocol-neutral HTTP layer                                              |
| [`@glandjs/express`](https://github.com/glandjs/http)  | Express adapter                                                          |

The transport packages live in separate repositories. This one holds the parts
that have no opinion about transport.

## Samples

Five runnable applications, one idea each. Every one depends on
`@glandjs/core` alone and defines its own protocol adapter, so all of them
typecheck and run without an external transport.

| Sample                                                      | Idea                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| [01-simple](samples/01-simple/)                             | One controller, one channel, one typed event. The shape of every app. |
| [02-modules](samples/02-modules/)                           | Nested modules, transitive registration, lifecycle order.             |
| [03-channels](samples/03-channels/)                         | `call` and `emit`, typed events, and what names-in-strings cost.      |
| [04-dependency-injection](samples/04-dependency-injection/) | `@Injectable`, `@Inject`, tokens, and how a container fails.          |
| [05-adapter](samples/05-adapter/)                           | Writing a protocol adapter — the core has no transport code.          |

```bash
cd samples/03-channels
pnpm install
pnpm dev
```

## Contributing

We welcome contributions to help improve Gland and shape it into a robust, production-ready framework. Here's how you can get involved:

1. Fork the repository.
2. Create a new branch for your feature or bug fix. This repository follows
   [git-flow](https://github.com/m-mdy-m/gix) — `gix bugfix start <name>` or
   `gix feature start <name>`.
3. Write tests to cover your changes. Bug fixes need a test that fails before
   the fix.
4. Submit a pull request with a detailed description of your changes.

Please review the [contributing guide](docs/development/CONTRIBUTING.md) before starting.

## Security

For details on our security practices and how to report vulnerabilities, please visit [SECURITY.md](docs/SECURITY.md).

## License

Gland is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Gland doesn't tell you how to build.
It asks: _what if everything was just a message?_
