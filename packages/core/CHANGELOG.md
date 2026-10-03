# @glandjs/core

Release notes for `@glandjs/core`. It is released together with
[`@glandjs/common`](../common/CHANGELOG.md) — the two are versioned in lockstep
because every metadata key the core reads is written by a decorator in
`common`, and a version skew between them is not a supported configuration.

The combined history of both packages also lives in
[docs/CHANGELOG.md](../../docs/CHANGELOG.md).

## 2.0.0

First stable release. The `-beta` suffix is dropped; the breaking changes listed
below are why the minor series could not continue.

The headline: dependency injection is now explicit and loud. In the beta,
whether the container could see a class's constructor parameters depended on
whether TypeScript happened to emit `design:paramtypes` for it — which it only
does for classes carrying a decorator. A service with no decorator of its own
silently received `undefined` for every dependency. `@Injectable()` makes that
contract visible, and the container now refuses to guess.

### Breaking

- **`Module` → `ModuleRef`.** The injector class was renamed so it no longer
  collides with the `@Module()` decorator exported by `@glandjs/common`. Both
  were importable under the name `Module`, which made any file needing both
  unreadable.
- **`GlandFactory.create()` returns `{ app, shutdown }`** instead of a bare
  `GlandBroker`. The shutdown handle existed (`ApplicationInitial.shutdown`)
  but was unreachable, because `GlandFactory` did not retain the
  `ApplicationInitial` it created. The returned shape is described by the new
  `GlandApplication` interface.
- **`GlandFactory.debugMode` is now `static`.** It was an instance getter on an
  object the caller never received.
- **`Container.modules` → `Container.moduleContainer`.**
- **`Container.register()` returns `ModuleRef<T>`** and takes the generic
  `ImportableModule<T>`. It now also records the module's own instance, which
  previously only `LifecycleScanner` could obtain — by constructing a second
  copy of the class.
- **`ApplicationBinder`'s constructor takes a `ChannelRegistryBuilder`** as its
  third argument. `bindChannel()` became the private `bindChannels()`,
  `bindControllers()` became private, and the private `combinePaths()` was
  removed in favour of `combineRoutePath()` from `@glandjs/common`.
- **`ApplicationBinder.routes` and `channelRegistry` are new getters**;
  `replayRoutes()` is new. See "Fixed" for why they exist.
- **`ApplicationInitial`'s constructor signature changed**: the third parameter is
  now `debug` (previously `mode`) and a fourth, `processHookOptions`, was added.
  `getLogger()` was removed — internal logging is now resolved through a single
  private `subLogger()`.
- **`ApplicationLifecycle`'s constructor takes `ProcessHookOptions`** as a third
  argument. Process handlers are now installed only when a logger is supplied,
  and are removed on shutdown.
- **`DependenciesScanner.scan()` returns the registered `ModuleRef`** instead of
  `void`. `DependenciesScanner.container` is now `public readonly`.
- **`LifecycleScanner.scanForHooks()` is idempotent.** A second call is a no-op
  rather than a duplicate registration. `LifecycleComponent` and
  `LifecycleComponentType` are now exported, along with `LIFECYCLE_HOOKS`.
- **`BrokerAdapter.broker` is `abstract broker: Broker<TEvents>`**, replacing
  `TEvents & TGlandBroker`. An adapter broker is an ordinary broker over
  whatever event map the adapter cares about; forcing it to satisfy
  `GlandEvents` made a plain `EventBroker<EventRecord>` an illegal assignment for
  no benefit. `broker` and `initialize()` are now declared `abstract`,
  `instance` uses definite-assignment (`instance!: TApp`), and the class
  generics have defaults. The route broadcast reaching the adapter's broker is
  the actual contract, and it is unchanged.
- **`BrokerAdapter.options` is now `protected readonly`.**
- **`GlandBroker`'s constructor takes an options object**
  (`{ name, maxListeners, cacheSize }`). `maxListeners` defaults to `100`
  instead of the broker default of `5`: every attached adapter subscribes to
  `gland:define:route`, so an application with a handful of protocols would
  otherwise exceed the limit for no good reason.
- **`Context`'s `broker` is `readonly`,** and `Context.state` is typed
  `ContextState`. `Context.call()` now throws `UnknownEventError` on an
  unregistered event instead of returning `undefined` (see "Fixed").
- **`GlandRoute` changed shape** — declared in `@glandjs/common`, consumed by
  every adapter. `meta: { path, method }` was replaced by `fullPath` (the
  combined controller-prefix + handler path that adapters should register) and
  `path` is now unambiguously the handler's own path. `method` is upper-cased,
  and `action` accepts extra arguments after the context so an adapter can pass
  route params or a parsed body through.
- **`InstanceWrapper.token` is widened** to `Function | string | symbol`, and
  `id` reports a string or symbol token as itself rather than
  `token.toString()`.
- **`DiscoveryService.getByMetadata()` takes `unknown`** instead of `any` for
  the metadata value, and its `select` callback is typed against `ModuleRef`.
- **`Explorer` no longer uses `DiscoveryService`.** It walks each module's
  controller and channel maps directly. `DiscoveryService` is still exported and
  still tested, but nothing inside the package calls it now.
- **`reflect-metadata` peer range narrowed** to `^0.2.2` (was
  `^0.1.12 || ^0.2.0`).
- **`engines.node` is now `>=22`**, matching the repository root, `.nvmrc` and
  CI. The beta claimed `>=20`, which was never exercised by a test run.

### Added

- **`@Injectable()`** (from `@glandjs/common`), plus a loud error from the
  container when a class has constructor arguments but no emitted
  `design:paramtypes` metadata. The message names the class and points at
  `emitDecoratorMetadata`.
- **`@Inject(token)` and `forwardRef()`** (from `@glandjs/common`), consumed by
  `Container.resolveParameter()`. Required for any parameter whose type erases
  to `Object` at runtime — an interface, a primitive, a string or symbol token.
- **`CircularDependencyError`** — reports the full cycle by name, and points at
  `@Inject(forwardRef(...))` as the way to break it.
- **`UnresolvableDependencyError`** — carries the owning class and the
  zero-based parameter index, so the failing argument is identifiable.
- **`UnknownEventError`** — thrown by `Context.emit()`/`Context.call()`, listing
  the channel events that do exist (capped at 40 suggestions).
- **`ProcessHooks` and `ProcessHookOptions`** — configurable `signals`,
  `exitOnSignal` and `reportErrors`, extracted out of
  `ApplicationLifecycle`. Handlers are tracked per instance, so `install()` is
  idempotent and `dispose()` removes exactly what was added.
- **`Container.bind(token, value)`** — binds a provider the container cannot
  build (a config object, a third-party client). Rebinding an existing provider
  throws rather than silently overriding it.
- **`Container.has(token)`.**
- **`GlandBroker.createContext()`** — builds a request context already wired to
  the application's channels, for a CLI command, a queue consumer, a scheduled
  job, or a test that calls a channel directly.
- **`GlandBroker.id`, `GlandBroker.attachBinder()`, `GlandBroker.shutdown()`.**
  `shutdown()` releases the core bus and detaches every adapter.
- **`ApplicationBinder.replayRoutes()`** and `ApplicationBinder.routes` — see
  "Fixed".
- **`Context.setState()`** and **`Context.attachRegistry()`**, plus the
  `ContextState` type and the `CHANNEL_STATE_KEY` / `BROKER_ID_STATE_KEY`
  constants.
- **`InstanceWrapper.isResolved`** and **`InstanceWrapper.tryGetInstance()`.**
- **`ModulesContainer.traverse(root?)`** — depth-first walk of the module tree,
  yielding a module reached through two parents once. `getByToken()` is now a
  `Map.get()` instead of a linear scan of `values()`.
- **`LIFECYCLE_HOOKS`** — every lifecycle hook, in invocation order.
- **New public barrels.** `index.ts` now also exports `./application`,
  `./gland-broker`, `./types`, and every injector submodule explicitly
  (`Container`, `ModulesContainer`, `InstanceWrapper`, `ModuleRef`,
  `DependenciesScanner`, `MetadataScanner`) rather than through a single
  directory re-export.

### Fixed

- **`GlandFactory.create()` did not `await` initialization.** It called
  `initial.initialize(root)` without awaiting, so `create()` resolved — and the
  caller could call `listen()` — before routes were registered. Binding,
  `onChannelInit` and `onAppBootstrap` all raced the caller. Initialization is
  now awaited.
- **Route handlers ran with `this === undefined`.** The binder invoked the bare
  prototype method as `target(ctx)`, breaking any handler that touched instance
  state. It now uses `target.apply(instance, [ctx, ...args])`.
- **Channel resolution compared only the text after the first colon**, making
  `db:create` and `cache:create` indistinguishable — whichever was discovered
  first won. Resolution is now a single O(1) lookup in a registry that
  `ChannelRegistryBuilder` freezes at bind time.
- **Duplicate channel event names bound silently.** Two channels claiming the
  same `namespace:event` left one permanently unreachable. This is now a
  startup error naming both owners.
- **`Context.emit()`/`call()` dispatched on the adapter's broker,** but channels
  are bound on the core bus, so both `emitTo`/`callTo` targeted a broker with no
  listener and returned nothing. Resolution now walks to the core bus named by
  `ctx.state.brokerId`, falling back to the local broker for a
  directly-constructed context.
- **`Container.resolve` pushed onto its cycle-detection stack _after_ walking
  dependencies,** so `A → B → A` recursed until the stack overflowed instead of
  reporting the cycle. The token is now marked in-progress before its
  dependencies are walked.
- **`LifecycleScanner` instantiated a second copy of each module class** for hook
  execution (`new module.metatype()`), discarding the container's instance and
  every dependency injected into it. Hooks now run against
  `ModuleRef.instance`.
- **An erased parameter type silently produced `{}`.** Interfaces, primitives,
  strings and index-signature types all erase to `Object` at runtime. The
  container now throws `UnresolvableDependencyError` naming the parameter, and
  primitive wrapper types (`String`/`Number`/`Boolean`) resolve to their
  intrinsic values instead.
- **`ModuleRef` imports were registered by re-scanning the metadata**, so a
  dynamic module's own `imports` were ignored in one path and duplicated in
  another. `Container.register()` is now the single walk.
- **Adapters attaching after bootstrap received no routes.** Routes were
  broadcast once during binding and never retained, and the normal order —
  bootstrap, then `connectTo()` — means every adapter missed them. The binder
  keeps a route log and `GlandBroker.connectTo()` replays it.
- **`unhandledRejection` called `process.exit(1)`.** A stray rejection anywhere
  in the application killed the process. Errors are now reported, and
  `ProcessHookOptions` makes the policy configurable.
- **Process handlers accumulated on every `create()`.** A full set of
  `SIGTERM`/`SIGINT`/`SIGHUP`/`uncaughtException`/`unhandledRejection` listeners
  was registered per bootstrap, so listener count grew without bound in tests
  and under hot reload. They are now registered once and removed on shutdown.
- **`normalizePath` collapsed duplicate slashes only on the absolute-path
  branch**, so `'api//v1'` normalised to `'/api//v1'` while `'/api//v1'`
  normalised to `'/api/v1'`. Both branches now behave identically.
- **`loadPackage` called `process.exit(1)`** on a missing optional dependency,
  which made it unusable in a server that should degrade gracefully and
  impossible to test. It now throws `MissingDependencyError` and lets the caller
  decide.
- **The per-request channel table was copied** into `ctx.state.channel` on every
  request. One frozen registry is now shared by reference.
- **`InstanceWrapper.getInstance()` treated a falsy instance as missing,** so a
  provider that legitimately resolved to a falsy value was reported as
  uninstantiated. The check is now explicitly against `undefined`.
- **An unregistered channel event returned `undefined`,** which surfaced at the
  call site as a missing result rather than a typo. It now throws
  `UnknownEventError` listing the events that do exist.
- **`LifecycleScanner.runHook` used `Promise.all`,** so one rejecting hook
  discarded every other result and skipped the rest of the phase. It now uses
  `Promise.allSettled` and logs each rejection. Synchronous throws were already
  caught per participant; that is unchanged.
- **Route paths were combined by string concatenation** inside the binder, with
  the trailing-slash handling differing from `normalizePath`. It now uses
  `combineRoutePath()` from `@glandjs/common`.
- **Route and channel discovery order was not deterministic across runs**,
  because `DiscoveryService` iterated a filtered array. `Explorer` now walks the
  module and provider maps in insertion order.
- **`ApplicationBinder` bound channels and controllers without ordering
  guarantees relative to each other's logs**; channels are now bound first, so a
  route handler can already reach them by the time it runs.

### Removed

- **`DependencyGraph`** (`injector/graph.ts`) — a node was written on every
  registration and `getNode()` was never called. The module tree is already
  navigable through `ModuleRef.imports`, and a second structure tracking the
  same relationships could only drift.

  Note: `CryptoUUID` also disappeared in this release, but it is a
  `@glandjs/common` export — see that package's changelog.

- **The second scanning pass in `DependenciesScanner`**, which re-walked the
  module tree and duplicated `Container.register`. `Container.register()` is
  idempotent and already transitive.
- **The duplicate `import 'reflect-metadata'` side-effect imports** from
  `injector/index.ts` and `injector/scanner/index.ts`. Every entry point
  imported it again, so the polyfill was loaded repeatedly on the way in; it is
  now imported once, at each package's entry point. Three further duplicates
  were removed from `@glandjs/common`'s barrels — see that package's changelog.

### Known issues

- `Context.requireBrokerId()` is private and unreferenced — `channelBroker()`
  inlines the same check. Harmless, but it should be deleted.
- `engines.node` was widened from `>=20` to `>=22` in this release. The code
  uses no Node 22-only API, so `>=20` would probably work in practice; `>=22` is
  what CI and `.nvmrc` actually validate.
- `@glandjs/events` is depended on as `"latest"`, which has already drifted —
  the lockfile resolved `1.1.2` where npm's `latest` tag is now `2.0.0`. This
  range should be pinned to a caret range before the next release.

## 1.0.3-beta

- `reflect-metadata` peer dependency narrowed to `^0.2.2` in both packages
  (was `^0.1.12 || ^0.2.0`).
- `Explorer.exploreControllers()`: comment and formatting only. The commit was
  titled `fix(metadata): fix load metadata for methods`, but the diff adds a
  trailing comment and removes two blank lines — no behavioural change shipped.

## 1.0.2-beta

- Build script fix: `clean` no longer left nested `.js`/`.d.ts` output behind,
  and `packages/core/tsconfig.json` dropped an empty `files: []` that suppressed
  the `include` glob.
- `prebuild` now runs `pnpm typecheck`, so a build that typechecks is the gate
  on publishable output.

## 1.0.1-beta

- Version bump only — no source changes. At this point the workspace root was
  still itself the publishable `@glandjs/core` artifact (`files` pointed at
  `packages/*`), so only the root manifest was bumped while
  `packages/core` and `packages/common` stayed at `1.0.0-beta` in the tree.
  This is the collision that made the version numbers ambiguous, and why the
  root manifest is now `@glandjs/workspace` with `"private": true`.

## 1.0.0-beta

- First public beta of the two-package core. `@glandjs/events` was split into
  its own repository; `@glandjs/core` publishes an `EventBroker` under the
  `@glandjs/core` name and protocol adapters attach to it.
- Preceded by `1.0.0-alpha`, `1.0.0-alpha.0`, `1.0.0-alpha.1` and `1.0.1-alpha`.
  The package was renamed from `gland` to `@glandjs/*` at `1.0.0-alpha`.
