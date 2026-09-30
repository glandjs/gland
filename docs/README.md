# Documentation

## Guides

| Guide                                                  | Covers                                     |
| ------------------------------------------------------ | ------------------------------------------ |
| [Getting started](guides/getting-started.md)           | A working application, start to finish     |
| [Modules](guides/modules.md)                           | Composition, dynamic modules, lazy imports |
| [Dependency injection](guides/dependency-injection.md) | Resolution order, `@Injectable`, cycles    |
| [Channels](guides/channels.md)                         | Addressing, naming rules, typed events     |
| [Controllers](guides/controllers.md)                   | Routing and the request context            |
| [Lifecycle](guides/lifecycle.md)                       | The five hooks and their order             |
| [Testing](guides/testing.md)                           | Unit and integration patterns              |

## Architecture

| Document                                        | Covers                                     |
| ----------------------------------------------- | ------------------------------------------ |
| [Overview](architecture/README.md)              | The four ideas the framework is built from |
| [Bootstrap sequence](architecture/bootstrap.md) | What happens, in order, during `create()`  |

## Reference

| Document                       | Covers              |
| ------------------------------ | ------------------- |
| [API reference](api/README.md) | Every public export |

## Development

| Document                                    | Covers                                  |
| ------------------------------------------- | --------------------------------------- |
| [Contributing](development/CONTRIBUTING.md) | Setup, conventions, branching, releases |

## Two things worth knowing before you start

**`emitDecoratorMetadata` is mandatory.** The container discovers a provider's
constructor parameters from compiler-emitted metadata, and that metadata is only
produced for decorated classes. A plain service without `@Injectable()` receives
`undefined` for every dependency. See
[Dependency injection](guides/dependency-injection.md).

**Channels are the way application code reaches application code.** A controller
does not import the service that holds the data; it calls it by name
(`ctx.call('db:product:find', id)`). That indirection is what lets every protocol
adapter share one implementation, and what makes a call observable without
patching the callee. See [Channels](guides/channels.md).
