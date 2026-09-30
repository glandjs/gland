# @glandjs/common

Framework-agnostic primitives: the decorators, metadata keys, event-name
helpers and types that `@glandjs/core` and every protocol adapter share.

```bash
npm install @glandjs/common
```

This package has no dependency on `@glandjs/core` and knows nothing about any
transport. That is what lets an application and an adapter speak one vocabulary.

## Decorators

### `@Module`

```ts
@Module({
  imports: [ProductModule],
  controllers: [ProductController],
  channels: [Database],
})
export class AppModule {}
```

All fields are optional. Imports are transitive and diamond-safe.

### `@Controller`

```ts
@Controller('products')
export class ProductController {
  @Get(':id')
  find(ctx: Context) {}
}
```

The prefix is prepended to every handler path.

### `@Channel` and `@On`

```ts
@Channel('db')
export class Database {
  @On('product:find')
  find(id: string) {}
}
```

`@Channel` namespaces the class, `@On` names a handler inside it. The pair is
addressed as `'db:product:find'`.

### `@Injectable`

```ts
@Injectable()
export class UserService {
  constructor(private users: UserRepository) {}
}
```

**Required for any class the container should construct.**

TypeScript only emits `design:paramtypes` for decorated classes, so an
undecorated class reaches the container with no parameter information and its
constructor receives `undefined` for every dependency. The decorator carries no
logic — its presence is the declaration, and that declaration is what makes the
compiler emit the metadata.

Controllers, channels and modules are already decorated and need nothing extra.

### `@Inject`

For parameters whose type cannot be inferred — interfaces, primitives, config
values:

```ts
@Injectable()
export class UserService {
  constructor(
    @Inject('userRepository') private users: UserRepository,
    @Inject(forwardRef(() => AuditLog)) private audit: AuditLog,
  ) {}
}
```

`@Inject` overrides reflected metadata when both are present.

### `forwardRef`

Defers _token lookup_, which solves a decorator-argument TDZ when a provider
depends on one declared further down the file. It does **not** make mutual
eager constructor injection work — see
[Dependency injection](../../docs/guides/dependency-injection.md).

## Event-name helpers

```ts
buildChannelEventName('db', 'product:create');
// 'gland:define:channel:db:product:create'

buildPublicEventName('db', 'product:create');
// 'db:product:create'

buildPublicEventName('', 'ping');
// 'ping'   — not ':ping', and never 'undefined:ping'
```

`ChannelRegistryBuilder` accumulates bindings, rejects duplicate public names at
build time, and freezes the result:

```ts
const builder = new ChannelRegistryBuilder();
builder.add('db', 'product:create', 'Database');
builder.freeze(); // frozen Record<'db:product:create', 'gland:define:channel:db:product:create'>
```

## Path helpers

```ts
normalizePath('api//v1//'); // '/api/v1'
combineRoutePath('/products', ':id'); // '/products/:id'
combineRoutePath('/', '/health'); // '/health'
```

Duplicate slashes are collapsed on both branches, and trailing slashes trimmed.

## `loadPackage`

```ts
const cors = loadPackage('cors', 'CORS support');
```

Throws `MissingDependencyError` when the package is missing. It does not call
`process.exit` — the caller decides whether a missing optional dependency is
fatal.

## Documentation

- [API reference](../../docs/api/README.md)
- [Channels](../../docs/guides/channels.md)
- [Modules](../../docs/guides/modules.md)

## License

MIT
