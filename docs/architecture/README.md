# Architecture

Gland is four ideas stacked on each other. Reading them in order explains
almost every design decision in the codebase.

```
  ┌─────────────────────────────────────────────────────────────┐
  │  Your application                                           │
  │  modules · controllers · channels                            │
  └───────────────┬─────────────────────────────────────────────┘
                  │ metadata
  ┌───────────────▼─────────────────────────────────────────────┐
  │  @glandjs/core                                              │
  │  Container → Explorer → Binder                              │
  │  (register)   (discover)   (publish)                        │
  └───────────────┬─────────────────────────────────────────────┘
                  │ events
  ┌───────────────▼─────────────────────────────────────────────┐
  │  @glandjs/events — the broker mesh                          │
  └───────────────┬─────────────────────────────────────────────┘
                  │ connectTo
  ┌───────────────▼─────────────────────────────────────────────┐
  │  Adapters: HTTP · WebSocket · Queue · …                     │
  └─────────────────────────────────────────────────────────────┘
```

## 1. Metadata is the only coupling

Components are never wired by hand. `@Module`, `@Controller`, `@Channel` and
`@On` write into `Reflect` metadata, and the core reads it back at startup.

The consequence worth stating plainly: **there is no naming convention**. A
method is a route because it carries `@Get()`, not because it is called `get` or
lives in a `controllers/` folder. Renaming a method cannot break a route, and
adding a method cannot accidentally create one.

The cost is that `@emitDecoratorMetadata` is mandatory — see
[Dependency injection](../guides/dependency-injection.md).

## 2. One container, one resolution rule

`Container` owns every provider in the process. Resolution is:

1. an explicit `@Inject(token)`, if present
2. otherwise the compiler-emitted `design:paramtypes`

Every provider is a singleton. Two modules importing the same service get the
same instance, because there is only one map of instances and one rule for
filling it.

`Container` also enforces the two failure modes that are otherwise invisible:

- **cycles** raise `CircularDependencyError` naming the whole chain
- **erased types** raise `UnresolvableDependencyError` explaining what to do

A DI container that silently injects `undefined` is worse than one with no DI,
because the failure surfaces somewhere else entirely.

## 3. Discovery turns metadata into intent

`Explorer` walks the registered modules and produces two flat lists:

- `RouteMetadata[]` — one entry per decorated controller method
- `ChannelMetadata[]` — one entry per `@On()` handler

Both are plain data. Nothing downstream has to re-parse metadata, and the
discovery rules are testable in isolation.

## 4. The binder publishes; adapters subscribe

This is the extension seam, and the reason the core has no transport code.

```
Binder                                   Adapter
  │                                        │
  ├── broker.on('gland:define:channel:…')  │   (channels land on the core bus)
  │                                        │
  └── broker.broadcast('gland:define:route', { method, fullPath, action })
                                           │
                              adapter subscribes and registers
                              the route on its own framework
```

An adapter implements two things — a broker and an `initialize()` — and the
framework works. Adding Fastify, or a queue consumer, or a CLI adapter means
writing one file and touching nothing in `core`.

Because adapters normally attach _after_ bootstrap (they need the application
handle in order to configure themselves), the binder keeps a route log and
`GlandBroker.connectTo()` replays it. Without that, every late adapter would
come up with no routes.

## Request flow

```
  HTTP request
      │
      ▼
  Adapter middleware builds a Context
      │
      ▼
  Adapter matches a route it registered from the broadcast
      │
      ▼
  Binder's action runs:
      ctx.attachRegistry(brokerId, registry)   ← frozen, shared
      target.call(controllerInstance, ctx)    ← `this` restored
      │
      ▼
  Controller calls ctx.call('db:product:find', id)
      │
      ▼
  Context resolves the public name via the registry (one property read)
      │
      ▼
  Dispatches on the core bus, where the channel was bound
      │
      ▼
  Channel handler returns a value, unwrapped back to the controller
```

Two details in that flow are deliberate:

- **`attachRegistry` stores a reference, not a copy.** The registry is frozen
  after binding, so every request shares one object instead of rebuilding a
  lookup table.
- **`target.call(instance, ctx)`** restores `this`. The handler is extracted as
  a bare prototype function, so invoking it directly would run with
  `this === undefined` and break any handler touching instance state.

## Lifecycle

Phases run in a fixed order, and each is fully awaited before the next begins.

| #   | Phase        | Hooks                                   |
| --- | ------------ | --------------------------------------- |
| 1   | register     | providers constructed                   |
| 2   | module init  | `onModuleInit`                          |
| 3   | bind         | channels bound, routes broadcast        |
| 4   | channel init | `onChannelInit`                         |
| 5   | bootstrap    | `onAppBootstrap`                        |
| —   | shutdown     | `onAppShutdown`, then `onModuleDestroy` |

Providers within a phase run concurrently; phases never overlap. A hook that
throws is logged and skipped rather than aborting the phase.

`GlandFactory.create()` resolves only after phase 5. That guarantee is what
makes it safe to call `listen()` on the line after.

## Shutdown and process signals

`ProcessHooks` installs `SIGTERM`/`SIGINT`/`SIGHUP` handlers, plus
`uncaughtException` and `unhandledRejection` _reporters_.

The asymmetry is deliberate:

- A **signal** means "shutting down" → run the hooks, exit cleanly
- An **unhandled rejection** is a bug in application code → log it, keep running

A framework that calls `process.exit(1)` on every stray promise is not being
robust, it is hiding the bug and taking the service down with it. Use
`options.processHooks` to change the policy.

## Reading order

| Document                                | What it answers                              |
| --------------------------------------- | -------------------------------------------- |
| [Bootstrap sequence](bootstrap.md)      | What happens, in order, during `create()`    |
| [DI internals](dependency-injection.md) | How resolution works and why it fails loudly |
| [The event model](event-model.md)       | Addresses, the registry, and the broker mesh |
