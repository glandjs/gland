# @glandjs/common

Release notes for `@glandjs/common`. It is released together with
[`@glandjs/core`](../core/CHANGELOG.md) — the two are versioned in lockstep
because every metadata key the core reads is written by a decorator here, and a
version skew between them is not a supported configuration.

The combined history of both packages also lives in
[docs/CHANGELOG.md](../../docs/CHANGELOG.md).

## 2.0.0

First stable release. The `-beta` suffix is dropped.

This package is framework-agnostic primitives: decorators, metadata keys,
event-name helpers and shared types. It has no dependency on `@glandjs/core`
and knows nothing about any transport — which is what lets an application and a
protocol adapter speak one vocabulary. The 2.0.0 work is mostly about making
that contract explicit rather than implicit, and about removing two exports that
were actively misleading.

The removals are why this is a major and not a minor: `CryptoUUID` and the `UUID`
type were part of this package's public API, and `GlandRoute` — the payload
every adapter consumes — changed shape.

### Breaking

- **`CryptoUUID` and the `UUID` type are removed.** They were exported from the
  package root via `utils/uuid.util.ts`, and the code duplicated `node:crypto`
  while `CryptoUUID.validate()` was wrong: it hard-coded version `4` and
  accepted any variant nibble in `[89ab]`, so it rejected valid non-v4 UUIDs and
  its own `generate()` output was the only thing it was ever used on. Use
  `node:crypto`'s `randomUUID()`.

  ```ts
  // before
  import { CryptoUUID } from '@glandjs/common';
  const id = CryptoUUID.generate();
  // after
  import { randomUUID } from 'node:crypto';
  const id = randomUUID();
  ```

- **`GlandRoute<TContext>` is now exported.** It was declared but not exported in
  the beta — reachable only as `GlandEvents['gland:define:route']` — so
  adapters had no name to import it under. Its shape also changed, which lands on
  every adapter:

  - `meta: { path, method }` is **removed**. `meta.method` held the _method
    name_ (`"find"`), not the HTTP verb, while `method` already held the verb —
    an adapter reading `meta.method` registered a route under the handler's
    function name.
  - `fullPath: string` is **added** — the combined controller-prefix + handler
    path that adapters should actually register (`'/products/:id'`).
  - `path` is now unambiguously the handler's own path, relative to the
    controller prefix (`':id'`), for adapters that mount sub-routers.
  - `method` is upper-cased (`'GET'`), so adapters no longer have to call
    `.toUpperCase()` themselves.
  - `action` is `(ctx, ...args) => unknown`. Extra arguments after the context
    are forwarded to the handler, so an adapter can pass route params, a parsed
    body, and so on.
  - Every field is now `readonly`.

  ```ts
  // before
  this.broker.on('gland:define:route', ({ meta, action }) => this.app[meta.method.toLowerCase()](meta.path, action));
  // after
  this.broker.on('gland:define:route', ({ method, fullPath, action }) => this.app[method.toLowerCase()](fullPath, action));
  ```

- **`loadPackage()` throws instead of killing the process, and its signature
  changed.** It previously called `process.exit(1)` on a missing optional
  dependency, which made it unusable in a server that should degrade gracefully
  and impossible to test. It now throws `MissingDependencyError` and lets the
  caller decide. The second parameter was renamed `context` → `reason` (it was
  always a human explanation, never a context), the third was narrowed from
  `Function` to `() => T`, and the return type is now `T` instead of `any`.

  ```ts
  // before — process exits here
  const cors = loadPackage('cors', 'CORS support');
  // after — caller decides
  let cors;
  try {
    cors = loadPackage<typeof import('cors')>('cors', 'CORS support');
  } catch (error) {
    if (error instanceof MissingDependencyError) cors = null;
    else throw error;
  }
  ```

- **`DynamicModule.exports` and `DynamicModule.global` are removed.** Both were
  declared in the type but never read by the container — a dynamic module's
  `exports` were silently ignored and `global` had no effect. Nothing that
  worked stops working.

- **`normalizePath()` behaves differently for relative paths.** Duplicate
  slashes were collapsed only on the absolute-path branch, so `'api//v1'`
  normalised to `'/api//v1'` while `'/api//v1'` normalised to `'/api/v1'`. Both
  branches now behave identically, and the function is idempotent for every
  input.

- **`@Controller()` defaults to `'/'`** instead of leaving the metadata
  `undefined`. The beta worked only because `Explorer` papered over the gap with
  `Reflect.getMetadata(...) || ''`; any consumer reading `PATH_METADATA`
  directly saw `undefined`.

- **`@Channel()` stores `''`** when no namespace is given, instead of
  `undefined`. The binder interpolated that straight into
  `` `gland:define:channel:${namespace}:${event}` ``, so a namespace-less
  channel was published under the literal event name
  `gland:define:channel:undefined:ping`.

- **`ChannelBinding`/`ChannelRegistry` are exported**, along with
  `ChannelRegistryBuilder`, `buildChannelEventName()` and `buildPublicEventName()`
  — see "Added".

- **`isDynamicModule()` is narrowed** to `(module: unknown) => module is
{ module: unknown } & Record<string, unknown>`. The previous predicate returned
  `module is DynamicModule` for anything truthy with a `.module` property, so
  `{ module: 'a string' }` type-checked.

- **`GlandChannel` — which was declared but never exported — is replaced by
  `GlandChannelPayload`** (an alias for `unknown`), and `GlandEvents` gained a
  `[key: string]: unknown` index signature so an adapter can add its own broker
  events without a type error.
- **`ModuleMetadata<T>` and `DynamicModule<T>` are now generic in their own
  right** rather than hard-coded to `Constructor<any>` / `Constructor[]`, and
  `ImportableModule<T>` carries the `T` through to `DynamicModule<T>`.
- **`reflect-metadata` peer range narrowed** to `^0.2.2` (was
  `^0.1.12 || ^0.2.0`).
- **`engines.node` is now `>=22`**, matching the repository root, `.nvmrc` and
  CI. The beta claimed `>=20`, which was never exercised by a test run.

### Added

- **`@Injectable()`** — marks a class as a dependency-injection provider.
  TypeScript's `emitDecoratorMetadata` only writes `design:paramtypes` for
  classes carrying at least one decorator, so a plain service reached the
  container with no parameter information and its constructor received
  `undefined` for every dependency — silently, and only at runtime. Any decorator
  opts a class in, but that is an implicit contract nobody can see.
  `@Injectable()` makes it explicit. `isInjectable()` is exported for the
  container's own diagnostics.

- **`@Inject(token)`** — injects a provider that cannot be inferred from the
  TypeScript type. Required for any parameter typed as an interface, a
  primitive, a string, or a symbol, all of which erase to `Object` in emitted
  metadata. Tokens are stored per-parameter-index on the class constructor, and
  written copy-on-write so decorating the same class in several places cannot
  leak tokens across those sites. `getInjectToken()` is exported for the
  container.

- **`forwardRef()`** — defers _token lookup_ so a provider can depend on one
  declared later in the file, which would otherwise hit the temporal dead zone
  at decorator-evaluation time. Branded with a private `Symbol` so
  `isForwardRef()` cannot be fooled by a hand-rolled `{ forwardRef: true }`.

- **`ChannelRegistryBuilder`** — accumulates channel bindings and **rejects
  duplicate public names**. Two channels claiming the same `namespace:event` used
  to resolve silently, whichever was discovered first; this turns "my handler is
  never called" into an immediate startup error naming both owners.
  `.freeze()` produces the single frozen `publicName -> brokerEventName` record
  shared by every request context.

- **`ChannelBinding`** and **`ChannelRegistry`** types. `ChannelBinding`
  exposes `namespace`, `event`, `publicName` (what applications address),
  `fullName` (the broker event actually bound) and `owner`.

- **`buildChannelEventName(namespace, event)`** and
  **`buildPublicEventName(namespace, event)`.** A channel without a namespace is
  still addressable: the segment is omitted rather than being stringified into
  the literal `"undefined"`.

  - `buildPublicEventName('db', 'product:create')` → `'db:product:create'`
  - `buildPublicEventName('', 'ping')` → `'ping'`

- **`combineRoutePath(basePath, handlerPath)`** — joins a controller prefix and
  a handler path into one route, replacing the binder's private string
  concatenation. Both sides are normalised first, so the two path sources cannot
  disagree about slashes.

- **`INJECT_METADATA`** — the metadata key `@Inject()` writes, keyed by
  parameter index. Declared on the class constructor, not the method, because
  constructor parameters are not reachable from the prototype.

- **`GLAND_ROUTE_EVENT`** and **`GLAND_CHANNEL_EVENT`** — promoted from inline
  string literals to exported constants. `GlandEvents` is now keyed off them, so
  a rename is a compile error rather than a silent no-op.

- **`GlandContextState`** — the state the binder attaches to every request
  context: `brokerId` and the frozen `channel` registry, both `readonly`.

- **`MissingDependencyError`** — thrown by `loadPackage()`, carrying
  `packageName`.

### Changed

- **`import 'reflect-metadata'` is now imported once, at the package entry
  point**, instead of from `decorators/index.ts`,
  `decorators/core/index.ts`, `decorators/events/index.ts` and
  `decorators/modules/index.ts`. It was being loaded four times over on the way
  in.
- **`GlandRoute<TContext>` is generic**, so an adapter can type its own context
  into the payload it receives.
- **`loadPackage()` is generic** (`loadPackage<T>`), so a caller gets the real
  module type instead of `any`.
- Every exported symbol in this package now carries TSDoc. The `@publicApi`
  markers that stood in for documentation have been replaced with prose that
  says what the symbol is for and when it matters.

### Fixed

- **`loadPackage()` called `process.exit(1)`** on a missing optional dependency,
  making it impossible to test and impossible to degrade gracefully.
- **`normalizePath` collapsed duplicate slashes only on the absolute-path
  branch**, so the two branches disagreed.
- **`@Channel()` without a namespace published handlers under the literal event
  name `gland:define:channel:undefined:ping`.**
- **`@Controller()` without a prefix produced `'undefined/products'`.**
- **An erased parameter type silently produced `{}`.** The container now refuses
  to guess; `UnresolvableDependencyError` (from `@glandjs/core`) names the
  parameter.
- **`isDynamicModule()` accepted any truthy `.module` property,** including a
  non-class value.
- **`@Inject()` tokens were written to a shared array,** so decorating the same
  class at two sites leaked tokens across them.

### Known issues

- `engines.node` was widened from `>=20` to `>=22` in this release. The code
  uses no Node 22-only API, so `>=20` would probably work in practice; `>=22` is
  what CI and `.nvmrc` actually validate.

## 1.0.3-beta

- `reflect-metadata` peer dependency narrowed to `^0.2.2` (was
  `^0.1.12 || ^0.2.0`).

## 1.0.2-beta

- Build script fix: `clean` no longer left nested `.js`/`.d.ts` output behind in
  `utils/`, `decorators/` and `interfaces/`.

## 1.0.1-beta

- Version bump only — no source changes. Published from the workspace root,
  which was still the publishable artifact at the time.

## 1.0.0-beta

- First public beta of the two-package core. The radix tree and the event
  registry moved out to `@glandjs/events`, which became a separate repository,
  leaving this package with decorators, metadata keys and types only.
- Preceded by `1.0.0-alpha`, `1.0.0-alpha.0`, `1.0.0-alpha.1` and `1.0.1-alpha`.
  The package was renamed from `gland` to `@glandjs/*` at `1.0.0-alpha`.
