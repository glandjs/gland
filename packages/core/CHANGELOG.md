# @glandjs/core

See the [root changelog](https://github.com/glandjs/gland/blob/main/docs/CHANGELOG.md)
for the combined history of `@glandjs/core` and `@glandjs/common`.

## 1.0.4-beta

### Breaking

- `Module` (the injector class) is now `ModuleRef`, so it no longer collides
  with the `@Module()` decorator from `@glandjs/common`
- `GlandFactory.create()` returns `{ app, shutdown }` instead of a bare
  `GlandBroker`. The `shutdown` handle was previously unreachable
- `Container`, `Explorer` and the scanners are exposed through explicit
  `index.ts` barrels
- `DynamicModule.exports` and `DynamicModule.global` were removed — they were
  declared but never implemented
- The `CryptoUUID` helper was removed. It duplicated `node:crypto` and its
  `validate()` was incorrect

### Fixed

- `GlandFactory.create()` did not `await` initialization, so an application could
  begin listening before its routes were registered
- Channel resolution compared only the text after the first colon, making
  `db:create` and `cache:create` indistinguishable. Resolution is now a single
  lookup in a frozen registry
- Duplicate channel event names bound silently; the first one discovered won.
  This is now a startup error naming both owners
- Route handlers ran with `this === undefined`, breaking any handler touching
  instance state
- `LifecycleScanner` instantiated a second copy of each module class for hook
  execution, discarding the container's instance and its dependencies
- `Container.resolve` pushed onto its cycle-detection stack _after_ walking
  dependencies, so a cycle overflowed the stack instead of reporting the chain
- Adapters attaching after bootstrap received no routes; the binder now keeps a
  route log and replays it on `connectTo`
- `unhandledRejection` no longer calls `process.exit(1)`. Errors are reported
  and the process keeps serving
- `normalizePath` collapsed duplicate slashes only on the absolute-path branch
- Process handlers are registered once and removed on shutdown, instead of
  accumulating on every `create()`
- `loadPackage` throws `MissingDependencyError` instead of calling
  `process.exit(1)`
- The per-request channel table is no longer copied; one frozen registry is
  shared by reference
- `InstanceWrapper.getInstance()` no longer treats a falsy instance as missing
- An unregistered channel event throws with the valid names listed, instead of
  returning `undefined`

### Added

- `@Injectable()`, and a clear error when a class has constructor arguments but
  no emitted metadata
- `@Inject(token)` and `forwardRef()`
- `CircularDependencyError` and `UnresolvableDependencyError`
- `UnknownEventError`, listing the events that do exist
- `ProcessHookOptions` — configurable signals, `exitOnSignal`, `reportErrors`
- `Ctx.attachRegistry()`, `Ctx.setState()`
- `ModulesContainer.traverse()`
- `ChannelRegistryBuilder`, `buildChannelEventName`, `buildPublicEventName`,
  `combineRoutePath`

### Removed

- `DependencyGraph` — written on every registration and never queried
- The second scanning pass in `DependenciesScanner`, which duplicated
  `Container.register`

## 1.0.3-beta

- Initial public beta of the two-package core.
