# 04 — Dependency injection

Every way a container can behave, including the ways it refuses to.

```bash
pnpm install
pnpm dev
```

```
1. A decorated provider, built by type
    [log] Greeting Ada
  greet('Ada')            -> "Good day, Ada."

2. Singletons
  same instance?          -> true

5. Failure: no decorator, so no metadata
  UnresolvableDependencyError
  Cannot resolve constructor parameter #0 of "Undecorated".
    The constructor takes arguments but no "design:paramtypes" metadata was emitted for it.

7. Failure: a cycle
  CircularDependencyError
  Cannot resolve circular dependency:
    Left
    -> Right
```

## `@Injectable()` is not optional

`emitDecoratorMetadata` — the compiler flag the container depends on — only
writes `design:paramtypes` for classes that carry a decorator. An undecorated
class reaches the container with no knowledge of what its constructor wants.

The old behaviour was to hand over `undefined` for every parameter. It was
silent, and it surfaced as `this.logger.info is not a function` in a different
file. Now the container refuses:

```
UnresolvableDependencyError
  The constructor takes arguments but no "design:paramtypes" metadata was
  emitted for it.
  TypeScript only emits that metadata for decorated classes: add
  @Injectable() …
```

Controllers, channels and modules are already decorated and need nothing
extra. Plain services do.

## `@Inject` for what types cannot express

An interface, an index signature, a primitive, a union — all of them erase to
`Object` or a wrapper at runtime. The container cannot infer a token from
nothing, so you name it:

```ts
@Injectable()
export class UserService {
  constructor(
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(FEATURE_FLAGS) private readonly flags: Record<string, boolean>,
  ) {}
}
```

`Container.bind` puts the values in:

```ts
container.bind(LOGGER, logger);
container.bind(FEATURE_FLAGS, { greetings: true, formal: true });
```

A token that was never bound says so, rather than injecting `undefined`:

```
UnresolvableDependencyError
  Cannot resolve constructor parameter #0 of "neverBound".
  Token "neverBound" is not bound to a provider.
```

## Singletons, and only singletons

Everything the container builds is a singleton. Two modules asking for the same
class get the same instance, because there is one instance map and one rule for
filling it. There is no request scope, because the DI layer has no notion of a
request.

## `forwardRef` is narrower than it sounds

It defers a _token lookup_, which solves one specific problem: a decorator
argument is evaluated when the class is defined, so referencing a class declared
further down the file hits the temporal dead zone.

```ts
constructor(@Inject(forwardRef(() => UserService)) private users: UserService) {}
```

It does **not** make mutual eager injection work. If both sides need the other's
_instance_, no lookup order satisfies them, and the container says so rather
than handing over a half-built object:

```
CircularDependencyError
  Cannot resolve circular dependency:
    Left
    -> Right
```

The way out is to extract the shared state into a third provider, or to inject a
factory instead of the instance.

## Files

| File                        | Contents                                             |
| --------------------------- | ---------------------------------------------------- |
| `src/providers/services.ts` | Each provider, annotated with why it is annotated    |
| `src/app.module.ts`         | The entry module                                     |
| `src/main.ts`               | Binds the tokens, then walks through all seven cases |
