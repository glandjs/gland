---
'@glandjs/core': minor
'@glandjs/common': minor
---

Fix bootstrap ordering, channel routing, and lifecycle handling; make
dependency injection explicit and loud.

**Correctness**

- `GlandFactory.create()` did not `await` initialization, so an application
  could begin listening before its routes were registered
- route handlers ran with `this === undefined`, breaking any handler that
  touched instance state
- channel resolution compared only the text after the first colon, making
  `db:create` and `cache:create` indistinguishable. Resolution is now a
  single lookup in a frozen registry built at bind time
- `Context.emit`/`call` dispatched on the adapter's broker, but channels are
  bound on the core bus, so both found no listener and returned nothing
- `Container` pushed onto its cycle-detection stack after walking
  dependencies, so a cycle overflowed the stack instead of reporting the
  chain
- `LifecycleScanner` instantiated a second copy of each module class for hook
  execution, discarding the container's instance and its dependencies
- an erased parameter type silently produced `{}`
- adapters attaching after bootstrap received no routes; the binder now keeps
  a route log and `GlandBroker.connectTo` replays it
- `normalizePath` collapsed duplicate slashes only on the absolute branch
- `loadPackage` called `process.exit(1)`; it now throws
  `MissingDependencyError` and lets the caller decide
- `InstanceWrapper.getInstance()` treated a falsy instance as missing
- process handlers accumulated on every `create()`; they are registered once
  and removed on shutdown

**Added**

- `@Injectable()`, with a clear error when a class has constructor arguments
  but no emitted metadata — TypeScript only writes `design:paramtypes` for
  decorated classes, so an undecorated service previously received `undefined`
  for every dependency
- `@Inject(token)` and `forwardRef()`
- `CircularDependencyError`, `UnresolvableDependencyError`, and
  `UnknownEventError`, which lists the events that do exist
- `ProcessHookOptions` — configurable signals, `exitOnSignal`, `reportErrors`.
  An unhandled rejection no longer terminates the process; it is reported
- `ChannelRegistryBuilder`, `buildChannelEventName`, `buildPublicEventName`,
  `combineRoutePath`, `ModulesContainer.traverse`, `Context.setState`

**Removed**

- `DependencyGraph`, written on every registration and never queried
- the second scanning pass, which duplicated `Container.register`
- `CryptoUUID`, which duplicated `node:crypto` and whose `validate()` was
  incorrect
- `DynamicModule.exports` and `DynamicModule.global`, declared but never
  implemented

**Breaking**

- `Module` the injector class is now `ModuleRef`, so it no longer collides
  with the `@Module()` decorator
- `GlandFactory.create()` returns `{ app, shutdown }`; the shutdown handle was
  previously unreachable
- duplicate channel event names now fail at startup rather than binding
  silently, with the first one discovered shadowing the rest
- an unknown channel event throws instead of returning `undefined`
