# API reference

Every public export of `@glandjs/core` and `@glandjs/common`.

## `@glandjs/core`

### `GlandFactory`

```ts
GlandFactory.debugMode: boolean
GlandFactory.create<T>(
  root: Constructor<T> | ImportableModule<T>,
  options?: ApplicationOptions,
): Promise<GlandApplication>
```

Bootstraps an application. Resolves only after every lifecycle phase completes,
so routes and channels are guaranteed to exist when it returns.

```ts
const { app, shutdown } = await GlandFactory.create(AppModule);
```

`ApplicationOptions`:

| Field          | Default                     | Purpose                   |
| -------------- | --------------------------- | ------------------------- |
| `debug`        | `!!process.env.GLAND_DEBUG` | verbose internal logging  |
| `processHooks` | see `ProcessHookOptions`    | signal and error handling |

### `GlandApplication`

| Member              | Type            | Purpose                           |
| ------------------- | --------------- | --------------------------------- |
| `app`               | `GlandBroker`   | the core bus and adapter registry |
| `shutdown(signal?)` | `Promise<void>` | run the shutdown phases           |

### `GlandBroker`

```ts
new GlandBroker(options?: { name?; maxListeners?; cacheSize? })
```

| Member                              | Description                                   |
| ----------------------------------- | --------------------------------------------- |
| `id`                                | the broker's id; `'@glandjs/core'` by default |
| `broker`                            | the underlying `Broker<GlandEvents>`          |
| `connectTo(AdapterClass, options?)` | attach an adapter, return its application     |
| `attachBinder(binder)`              | internal — lets late adapters be caught up    |
| `shutdown()`                        | release the bus                               |

`maxListeners` defaults to 100 rather than the events package's 5, because every
adapter subscribes to the route broadcast.

### `Container`

```ts
new Container(logger?)
```

| Member                           | Description                                            |
| -------------------------------- | ------------------------------------------------------ |
| `register(module, parentToken?)` | register a module and its imports; returns `ModuleRef` |
| `resolve(token)`                 | build or return the singleton for `token`              |
| `has(token)`                     | whether a provider has been built                      |
| `moduleContainer`                | `ModulesContainer`                                     |

**Errors**

| Error                         | Cause                                                                   |
| ----------------------------- | ----------------------------------------------------------------------- |
| `CircularDependencyError`     | a cycle; `error.cycle` holds the chain                                  |
| `UnresolvableDependencyError` | a parameter with no usable token; `error.owner`, `error.parameterIndex` |

### `ModuleRef`

```ts
new ModuleRef(token, metatype);
```

| Member                          | Type                                   | Description                        |
| ------------------------------- | -------------------------------------- | ---------------------------------- |
| `token`                         | `string`                               | module identifier (its class name) |
| `metatype`                      | `Constructor`                          | the module class                   |
| `instance`                      | `T \| undefined`                       | the container-built instance       |
| `imports`                       | `Set<ModuleRef>`                       | imported modules                   |
| `controllers`                   | `Map<InjectionToken, InstanceWrapper>` | owned controllers                  |
| `channels`                      | `Map<InjectionToken, InstanceWrapper>` | owned channels                     |
| `addImports(imports)`           |                                        | merge, ignoring duplicates         |
| `addController(cls, instance?)` |                                        | register or replace                |
| `addChannel(cls, instance?)`    |                                        | register or replace                |

> Named `ModuleRef`, not `Module`, so it never collides with the `@Module()`
> decorator exported by `@glandjs/common`.

### `ModulesContainer`

Extends `Map<string, ModuleRef>`.

| Member              | Description                     |
| ------------------- | ------------------------------- |
| `getByToken(token)` | O(1) lookup                     |
| `traverse(root?)`   | depth-first walk, de-duplicated |

### `InstanceWrapper`

```ts
new InstanceWrapper(token, instance?)
```

| Member             | Description                            |
| ------------------ | -------------------------------------- |
| `token`            | the provider's token                   |
| `id`               | a human-readable identifier            |
| `isResolved`       | whether an instance exists             |
| `getInstance()`    | the instance; **throws** if unresolved |
| `tryGetInstance()` | the instance, or `undefined`           |

### `Explorer`

```ts
new Explorer(modulesContainer, logger?)
```

| Member                    | Returns                |
| ------------------------- | ---------------------- |
| `exploreControllers<T>()` | `RouteMetadata<T>[]`   |
| `exploreChannels<T>()`    | `ChannelMetadata<T>[]` |

`RouteMetadata`: `{ method, route, controller: { path, instance, methodName, target } }`
`ChannelMetadata`: `{ instance, token, event, namespace, target }`

### `MetadataScanner`

| Member                                  | Description                                             |
| --------------------------------------- | ------------------------------------------------------- |
| `scanFromPrototype(prototype, handler)` | invoke `handler` per own method                         |
| `getAllFilteredMethodNames(prototype)`  | own method names, excluding `constructor` and accessors |

### `DiscoveryService`

| Member                                    | Description                |
| ----------------------------------------- | -------------------------- |
| `getByMetadata(key, value, select, type)` | wrappers carrying metadata |
| `getControllers(key, value?)`             | matching controllers       |
| `getChannels(key, value?)`                | matching channels          |

### `Context<TEvents>`

```ts
new Context(broker);
```

| Member                               | Description                                |
| ------------------------------------ | ------------------------------------------ |
| `state`                              | per-request bag; assignment **merges**     |
| `setState(data)`                     | explicit merge                             |
| `error`                              | set by adapters when a handler throws      |
| `call(event, data)`                  | invoke a channel handler, return its value |
| `call(event, data, 'all')`           | return an array of results                 |
| `emit(event, payload, options?)`     | invoke a handler, discard the value        |
| `on` / `once` / `off`                | raw broker subscription                    |
| `attachRegistry(brokerId, registry)` | internal — called by the binder            |

**Errors**

`UnknownEventError` is thrown by `call` and `emit` for an unregistered name;
`error.available` lists the valid ones.

### `BrokerAdapter`

```ts
abstract class BrokerAdapter<TEvents, TApp, TOptions> {
  abstract broker: TEvents & TGlandBroker;
  instance: TApp;
  abstract initialize(): TApp;
}
```

### Lifecycle

`ApplicationInitial`, `ApplicationLifecycle`, `ApplicationBinder`,
`LifecycleScanner`, `ProcessHooks`, and the hook interfaces
`OnModuleInit`, `OnModuleDestroy`, `OnAppBootstrap`, `OnAppShutdown`,
`OnChannelInit`.

See [Lifecycle](../guides/lifecycle.md).

### `ProcessHooks`

```ts
new ProcessHooks(logger?, options?: ProcessHookOptions)
install(onShutdown: (signal) => Promise<void> | void): void
dispose(): void
```

| Option         | Default                         | Purpose                                |
| -------------- | ------------------------------- | -------------------------------------- |
| `signals`      | `['SIGTERM','SIGINT','SIGHUP']` | signals that trigger shutdown          |
| `exitOnSignal` | `true`                          | exit after handling a signal           |
| `reportErrors` | `true`                          | log uncaught exceptions and rejections |

## `@glandjs/common`

### Decorators

| Decorator              | Applies to | Effect                                  |
| ---------------------- | ---------- | --------------------------------------- |
| `@Module(metadata)`    | class      | declares controllers, channels, imports |
| `@Controller(path?)`   | class      | HTTP route prefix                       |
| `@Channel(namespace?)` | class      | event namespace                         |
| `@On(event)`           | method     | binds a channel handler                 |
| `@Injectable()`        | class      | opts into DI metadata emission          |
| `@Inject(token)`       | parameter  | explicit injection token                |

### `forwardRef`

```ts
forwardRef<T>(tokenFn: () => T | InjectionToken): ForwardRef<T>
isForwardRef(value: unknown): value is ForwardRef
getInjectToken(ctor: Function, index: number): InjectionToken | undefined
isInjectable(metatype: Function): boolean
```

### Constants

| Name                  | Value                    |
| --------------------- | ------------------------ |
| `PATH_METADATA`       | `'path'`                 |
| `METHOD_METADATA`     | `'method'`               |
| `MODULE_METADATA`     | `'__module__'`           |
| `INJECT_METADATA`     | `'__inject__'`           |
| `GLAND_ROUTE_EVENT`   | `'gland:define:route'`   |
| `GLAND_CHANNEL_EVENT` | `'gland:define:channel'` |

### Event-name helpers

```ts
buildChannelEventName(namespace?, event): string
buildPublicEventName(namespace?, event): string
class ChannelRegistryBuilder {
  add(namespace, event, owner): ChannelBinding
  all(): ChannelBinding[]
  freeze(): ChannelRegistry
}
```

`ChannelRegistry` is a frozen, prototype-less `Record<publicName, brokerEvent>`.

### Path helpers

```ts
normalizePath(path?: string): string
combineRoutePath(basePath?, handlerPath?): string
```

### `loadPackage`

```ts
loadPackage<T>(name: string, reason: string, loaderFn?: () => T): T
```

Throws `MissingDependencyError` when the package cannot be resolved. It does
**not** call `process.exit` — the caller decides.

### Types

```ts
type InjectionToken<T> = string | symbol | Constructor<T> | Function | ForwardRef<T>
type ImportableModule<T> = Constructor<T> | DynamicModule<T> | Promise<DynamicModule<T>>

interface ModuleMetadata<T>  { imports?; controllers?; channels? }
interface DynamicModule<T>   { module; controllers?; channels?; imports? }
interface GlandRoute<T>      { path; fullPath; method; action }
interface GlandEvents        { ... }
```

### `isDynamicModule`

```ts
isDynamicModule(value: unknown): value is DynamicModule
```
