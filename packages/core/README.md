# @glandjs/core

The transport-agnostic heart of Gland: module registration, dependency
injection, metadata discovery, and the event bus that protocol adapters attach
to.

```bash
npm install @glandjs/core @glandjs/common
```

## Quick start

```ts
import { Module } from '@glandjs/common';
import { GlandFactory } from '@glandjs/core';
import { ExpressBroker } from '@glandjs/express';

@Module({ imports: [ProductModule] })
export class AppModule {}

const { app, shutdown } = await GlandFactory.create(AppModule);

const express = app.connectTo(ExpressBroker);
express.listen(3000);

process.on('SIGTERM', () => void shutdown('SIGTERM'));
```

`create()` resolves only after every lifecycle phase completes, so calling
`listen()` on the next line cannot race route registration.

## What this package provides

| Area      | Export                                                          |
| --------- | --------------------------------------------------------------- |
| Bootstrap | `GlandFactory`, `ApplicationInitial`                            |
| The bus   | `GlandBroker`, `TGlandBroker`                                   |
| DI        | `Container`, `ModuleRef`, `ModulesContainer`, `InstanceWrapper` |
| Discovery | `Explorer`, `DiscoveryService`, `MetadataScanner`               |
| Binding   | `ApplicationBinder`, `ApplicationLifecycle`                     |
| Lifecycle | `LifecycleScanner`, `ProcessHooks`, the hook interfaces         |
| Request   | `Context`, `UnknownEventError`                                  |
| Extension | `BrokerAdapter`                                                 |

## Design notes

**`create()` is awaited.** It used to be called without `await`, so an
application could begin listening before its routes were bound.

**DI fails loudly.** A cycle raises `CircularDependencyError` naming the chain.
An erased parameter type raises `UnresolvableDependencyError` explaining the
fix. Neither case produces a silently `undefined` dependency.

**Channel resolution is a single property read.** The binder freezes one
`publicName -> brokerEvent` registry at startup and shares it by reference, so
a request never rebuilds a lookup table.

**Handlers keep their `this`.** A handler is extracted as a bare prototype
function; the binder restores the instance at dispatch.

**Unhandled rejections do not exit the process.** They are logged. Signals shut
the application down; a stray promise is a bug to fix, not a reason to drop
traffic. See `ProcessHookOptions`.

## Documentation

- [Getting started](../../docs/guides/getting-started.md)
- [Dependency injection](../../docs/guides/dependency-injection.md)
- [Channels](../../docs/guides/channels.md)
- [Lifecycle](../../docs/guides/lifecycle.md)
- [Architecture](../../docs/architecture/README.md)
- [API reference](../../docs/api/README.md)

## License

MIT
