# Changelog

Release notes for the Gland packages in this repository. Each package also has
its own `CHANGELOG.md`:

| Package                                                 | Version | Changelog                                    |
| ------------------------------------------------------- | ------- | -------------------------------------------- |
| [`@glandjs/core`](../../packages/core/CHANGELOG.md)     | `2.0.0` | [core](../../packages/core/CHANGELOG.md)     |
| [`@glandjs/common`](../../packages/common/CHANGELOG.md) | `2.0.0` | [common](../../packages/common/CHANGELOG.md) |

The two packages are versioned in lockstep. Every metadata key the core reads is
written by a decorator in `common`, so a version skew between them is not a
supported configuration — and `@glandjs/core` declares
`@glandjs/common` as a `peerDependency` rather than a dependency, so nothing
enforces the pairing at install time.

## Version history at a glance

| Version         | `@glandjs/core`  | `@glandjs/common` | Published  |
| --------------- | ---------------- | ----------------- | ---------- |
| `2.0.0`         | ✅ `2.0.0`       | ✅ `2.0.0`        | 2026-10-03 |
| `1.0.3-beta`    | ✅ `1.0.3-beta`  | ✅ `1.0.3-beta`   | 2025-05-17 |
| `1.0.2-beta`    | ✅ `1.0.2-beta`  | ✅ `1.0.2-beta`   | 2025-05-17 |
| `1.0.1-beta`    | ✅ `1.0.1-beta`  | ✅ `1.0.1-beta`   | 2025-05-16 |
| `1.0.0-beta`    | ✅ `1.0.0-beta`  | ✅ `1.0.0-beta`   | 2025-05-16 |
| `1.0.1-alpha`   | ✅ `1.0.1-alpha` | ✅ `1.0.1-alpha`  | 2025-04-11 |
| `1.0.0-alpha`   | ✅ `1.0.0-alpha` | ✅ `1.0.0-alpha`  | 2025-04-10 |
| `1.0.0-alpha.1` | ✅               | ✅                | 2025-03-27 |
| `1.0.0-alpha.0` | ✅               | ✅                | 2025-03-27 |

`2.0.0` is the first stable release of either package. Everything before it
carried a pre-release identifier.

## 2.0.0 — `@glandjs/core` and `@glandjs/common`

The beta hardened the core. The headline change is that `emitDecoratorMetadata`
is now a stated requirement rather than an accident, because without it the
container could not know what to inject.

Both packages take a major bump, not a minor one. `@glandjs/core` because
`Module` was renamed and `create()` changed its return type.
`@glandjs/common` because `CryptoUUID` and the `UUID` type were removed from its
public API and `GlandRoute` — the payload every adapter consumes — changed
shape.

**Migration**

1. Add `@Injectable()` to any class the container constructs that has
   constructor parameters and no other Gland decorator. TypeScript only emits
   `design:paramtypes` for decorated classes.

   ```ts
   // before — received undefined for every dependency
   export class UserService {
     constructor(private users: UserRepository) {}
   }
   // after
   @Injectable()
   export class UserService {
     constructor(private users: UserRepository) {}
   }
   ```

   If a parameter's type is an interface, a primitive, a string or a symbol, it
   erases to `Object` at runtime and `@Injectable()` is not enough — annotate the
   parameter with `@Inject(token)`.

2. `GlandFactory.create()` now returns `{ app, shutdown }`:

   ```ts
   // before
   const app = await GlandFactory.create(AppModule);
   // after
   const { app, shutdown } = await GlandFactory.create(AppModule);
   ```

   `create()` also now awaits initialization, so `app` is fully wired by the time
   the promise resolves.

3. `Module` the injector class is now `ModuleRef`, imported from
   `@glandjs/core`. The name `@Module()` stays with the decorator in
   `@glandjs/common`.

4. An unknown channel event now throws `UnknownEventError`, listing the events
   that exist. If you relied on `ctx.call()` returning `undefined` for a
   misspelled name, catch it or check the name.

5. Adapters must be updated for the new `GlandRoute` payload. `meta` is gone;
   register routes from `method` and `fullPath`:

   ```ts
   // before
   this.broker.on('gland:define:route', ({ meta, action }) => this.app[meta.method.toLowerCase()](meta.path, action));
   // after
   this.broker.on('gland:define:route', ({ method, fullPath, action }) => this.app[method.toLowerCase()](fullPath, action));
   ```

   `meta.method` held the _handler name_, not the HTTP verb — so this fixes
   adapters that were registering routes under a function name.

6. `CryptoUUID` is gone. Use `randomUUID()` from `node:crypto`.

7. `loadPackage()` throws `MissingDependencyError` instead of calling
   `process.exit(1)`. Wrap the call if the dependency is optional.

8. `engines.node` is now `>=22` in both packages, matching the repository root,
   `.nvmrc` and CI. The beta claimed `>=20`, which no test run ever exercised.

See the [package changelogs](../../packages/core/CHANGELOG.md) for the full list,
and [dependency injection](../guides/dependency-injection.md) for the reasoning
behind each change.

## 1.0.3-beta

- `reflect-metadata` peer dependency narrowed to `^0.2.2` in both packages.

## 1.0.2-beta

- Build script fix: `clean` no longer left nested build output behind, and
  `packages/core/tsconfig.json` dropped an empty `files: []` that suppressed its
  `include` glob.

## 1.0.1-beta

- Version bump only — no source changes.

## 1.0.0-beta

- Initial public beta of the two-package core.
