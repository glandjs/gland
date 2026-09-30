# Dependency injection

`Container` builds every provider in the process, once each.

## The rule that matters

**TypeScript only emits `design:paramtypes` for a class that carries a
decorator.**

That single fact explains most of this page. Without a decorator, a class
reaches the container with no parameter information, and its constructor
receives `undefined` for every dependency — silently, at runtime, and only
when that particular path is exercised.

Gland's answer is `@Injectable()`:

```ts
@Injectable()
export class UserService {
  constructor(private users: UserRepository) {}
}
```

The decorator itself carries no logic. Its presence is the declaration that
this class wants its constructor resolved, and that declaration is what makes
the compiler emit the metadata.

Controllers, channels and modules are already decorated, so they need nothing
extra. Plain services do.

## Resolution order

For each constructor parameter:

1. **`@Inject(token)`** — used verbatim if present
2. **`design:paramtypes`** — the reflected type
3. **intrinsic** — `String` → `''`, `Number` → `0`, `Boolean` → `false`
4. **otherwise** — `UnresolvableDependencyError`

Primitive parameters get the intrinsic value, not a manufactured wrapper. A
provider declaring `retries: number` should not receive `new Number(0)`.

## Singletons

Every provider is a singleton, resolved once and cached by token:

```ts
container.resolve(UserService) === container.resolve(UserService); // true
```

Two modules importing the same service share the instance, because there is one
instance map. There is no request scope, and no transient lifetime — the
framework has no notion of a request at the DI layer.

## `@Inject`

Required whenever the parameter type cannot be inferred:

```ts
const USER_REPO = 'userRepository';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPO) private users: UserRepository, // interface
    @Inject('flags') private flags: Record<string, boolean>, // config value
  ) {}
}
```

`@Inject` also overrides reflected metadata when both are present, which is
useful when a reflected type is ambiguous.

Tokens are **copy-on-write**. Decorating a second class never disturbs the
first class's token list, so a `@Inject` at index 1 cannot shift index 0.

## Interfaces are the common case

An `interface` erases to `Object` at runtime. So does a union, an index
signature, and `any`. The container refuses these rather than handing over `{}`:

```
Cannot resolve constructor parameter #0 of "UserService".
  The parameter's type erased to "Object" at runtime (interface, primitive, or union).
  Annotate it with @Inject(Token) so the container knows what to build.
```

A silently empty object is far worse than this error: it fails later, somewhere
unrelated, with a message that points nowhere near the cause.

## Cycles

A cycle is a hard error, and the message names the whole chain:

```
Cannot resolve circular dependency:
  OrderService
  -> UserService
  -> OrderService

Break the cycle with @Inject(forwardRef(() => Token)) on at least one link.
```

### `forwardRef`

`forwardRef` defers **token lookup**, which solves a specific problem: a
decorator argument is evaluated when the class is defined, so referencing a class
declared further down the file hits the temporal dead zone.

```ts
class Consumer {
  constructor(@Inject(forwardRef(() => Provider)) private p: Provider) {}
}
class Provider {} // fine — nothing is read until resolution
```

### What `forwardRef` does not do

It does not make mutual constructor injection work. If `Provider` in turn needs
`Consumer`'s **instance** eagerly, no lookup order satisfies both, and the
container raises `CircularDependencyError`.

That is not a limitation of the implementation — it is a property of eager
construction. Three ways out:

1. **Extract the shared state** into a third provider that both depend on
2. **Inject a factory** instead of the instance: `@Inject(TOKEN) () => Other`
3. **Pass the value** through the constructor of whoever creates the cycle

The framework will not paper over this for you, because a lazily-proxied
dependency tends to fail at the worst possible moment instead.

## Dynamic modules

A dynamic module merges its arrays with the class's `@Module()` metadata:

```ts
@Module({ channels: [Database] })
class TenantModule {}

const dynamic = { module: TenantModule, channels: [AuditChannel] };
// result: channels [Database, AuditChannel]
```

## Working with the container directly

```ts
const container = new Container(logger);

const root = await container.register(AppModule);
container.resolve(UserService);
container.has(UserService); // was it built?
container.moduleContainer.getByToken('ProductModule');
container.moduleContainer.traverse(); // depth-first module walk
```

`Container` is exported, but most applications should only reach for
`GlandFactory.create()`. The container is public mainly so tests can build a
small graph without booting a whole application.
