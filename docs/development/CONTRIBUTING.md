# Contributing

## Setup

```bash
git clone https://github.com/glandjs/gland.git
cd gland
pnpm install
```

Requires **Node.js 20+** and **pnpm 9+**.

## Commands

| Command                 | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `pnpm build`            | typecheck, then build both packages         |
| `pnpm typecheck`        | `tsc --noEmit` over `packages/` and `test/` |
| `pnpm test:unit`        | unit suite                                  |
| `pnpm test:integration` | integration suite                           |
| `pnpm test:all`         | both                                        |
| `pnpm coverage`         | coverage summary                            |
| `pnpm lint`             | Prettier check                              |
| `pnpm lint:fix`         | Prettier write                              |
| `pnpm clean`            | remove build output                         |

## Layout

```
packages/
  common/          @glandjs/common — decorators, metadata, types, utils
    constant.ts
    decorators/    core/  events/  modules/
    interfaces/    modules.interfaces.ts  gland-events.interfaces.ts
    types/         modules.type.ts
    utils/         shared.util.ts  load-pkg.util.ts
  core/            @glandjs/core — DI, modules, binding, lifecycle
    adapter/       BrokerAdapter
    application/   ApplicationInitial  ApplicationBinder  ApplicationLifecycle
    context/       Context
    hooks/         lifecycle.scanner  process-hooks
    injector/      container/  scanner/  explorer  discovery-service
                   instance-wrapper  module
    types/         gland-broker.type.ts
test/
  unit/            per-module specs
  integration/     end-to-end bootstrap
docs/              architecture, api, guides, development
```

## Conventions

### Formatting

Prettier, configured in `.prettierrc`: 200-column lines, single quotes, trailing
commas. Run `pnpm lint:fix` before committing; `lint-staged` handles it via husky.

### Naming

| Thing         | Convention        | Example                 |
| ------------- | ----------------- | ----------------------- |
| file          | `kebab-case`      | `application-binder.ts` |
| class         | `PascalCase`      | `ApplicationBinder`     |
| function      | `camelCase`       | `buildPublicEventName`  |
| private field | no prefix         | `registryBuilder`       |
| constant      | `SCREAMING_SNAKE` | `PATH_METADATA`         |

### Comments

Explain **why**, not **what**. The code already says what it does.

```ts
// Good: the constraint that produced the code
const count = Math.max(paramTypes.length, arity);

// Noise: restating the next line
// Get the parameter types
const paramTypes = /* … */;
```

A comment earns its place when the code would otherwise look wrong — a
workaround, a subtle invariant, a deliberate deviation from an obvious
alternative. Every non-obvious branch in this codebase is there because the
obvious version was wrong; say so.

### Public API

Everything exported from a package's `index.ts` is public API. Renaming or
changing a signature is a breaking change and needs a changeset.

Prefer adding a new export over changing an existing one. `Module` the class
became `ModuleRef` precisely because both were already public and
indistinguishable.

### Errors

Throw a named error class, and put the actionable part in the message:

```ts
throw new UnresolvableDependencyError(owner, index, `The parameter's type erased to "Object" at runtime.\n  Annotate it with @Inject(Token).`);
```

Silent failure is the cardinal sin. A DI container that injects `undefined` is
worse than no container, because the failure surfaces somewhere unrelated.

## Testing

New behaviour needs a test. Bug fixes need one that fails before the fix.

```bash
pnpm test:unit -- --grep "channel"
```

Two constraints:

1. **Run under ts-node.** `emitDecoratorMetadata` is a compiler feature;
   esbuild (and therefore `tsx`) does not implement it, so `design:paramtypes`
   is absent and every injection fails. `tsconfig.test.json` configures this.
2. **Do not assert on `toString()` output of a class.** It varies with the
   transform tool and with minifier settings. Assert on identity, on a
   constructor name, or on behaviour.

See [Testing](guides/testing.md).

## Commit messages

Conventional Commits, enforced by commitlint:

```
feat(core): add forwardRef for deferred token lookup
fix(container): detect cycles before walking dependencies
docs(guides): explain the emitDecoratorMetadata requirement
test(binder): cover late-attaching adapters
```

## Branching

This repository uses [gix](https://github.com/m-mdy-m/gix), a git-flow wrapper.
The model lives in `.gix/config`.

```bash
gix bugfix start my-fix         # from develop
gix feature start my-feature    # from develop
gix release start 1.1.0         # merges to main + develop, taggable
gix hotfix start urgent         # from main, merges to both
```

Finish merges back and cleans up:

```bash
gix bugfix finish my-fix
```

## Releasing

```bash
pnpm changeset          # describe the change
pnpm version            # bump versions, update CHANGELOGs
pnpm release:beta       # or :alpha / :next
```

## Reporting bugs

Open an issue with the reproduction steps, the Gland version, and Node version.
If the bug is a silent failure, a failing assertion is worth more than a
description.
