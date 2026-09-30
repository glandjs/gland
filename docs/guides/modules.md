# Modules

A module is a unit of composition: a set of controllers and channels, plus the
modules it depends on.

## Declaring

```ts
import { Module } from '@glandjs/common';

@Module({
  imports: [ProductModule, UserModule],
  controllers: [ProductController, UserController],
  channels: [ProductStore, UserStore],
})
export class AppModule {}
```

All three fields are optional. The module tree is walked once at startup, and
everything reachable from the root is registered.

## Transitivity

Imports are transitive. If `AppModule` imports `ProductModule`, which imports
`CatalogModule`, all three are registered — there is no need to list every
module at the root.

Registration is also **diamond-safe**: if two modules import the same third
module, it is registered once and both reference the same instance.

## Module classes are providers

A module class is constructed like any other provider, so it can take
dependencies and implement lifecycle hooks:

```ts
@Module({ imports: [ProductModule] })
export class AppModule implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.config.validate();
  }
}
```

Its hooks run against **the instance the container built**, with its dependencies
injected. An earlier implementation instantiated a second copy for hook
scanning, discarding the real one.

## Inspecting a module

```ts
const container = new Container();
const root = await container.register(AppModule);

root.token; // 'AppModule'
root.metatype; // the class
root.instance; // the constructed instance
root.imports; // Set<ModuleRef>
root.controllers; // Map<InjectionToken, InstanceWrapper>
root.channels; // Map<InjectionToken, InstanceWrapper>
```

## Dynamic modules

A dynamic module supplies metadata at runtime — for example, a controller list
computed from configuration.

```ts
@Module({ channels: [Database] })
class TenantModule {}

const dynamic = {
  module: TenantModule,
  channels: [AuditChannel, MetricsChannel],
  controllers: tenantControllers,
};
```

A dynamic module's arrays are **merged** with the class's `@Module()` metadata,
not substituted. The example registers `Database`, `AuditChannel` and
`MetricsChannel`.

Register one directly:

```ts
await container.register(dynamic);
```

## Lazy imports

A module can be imported as a promise, which is how a cycle between two modules
is broken:

```ts
@Module({
  imports: [Promise.resolve(() => require('./lazy').LazyModule)],
})
export class AppModule {}
```

The thunk is only invoked after both modules are defined.

## Accessing a module's providers

Modules namespace their providers, and there is no global "get by name" — that
is the point of channels. When you genuinely need an instance (in tests, or for
infrastructure), go through the container:

```ts
container.resolve(ProductStore);
container.moduleContainer.getByToken('ProductModule');
```

## Naming

Module tokens are class names, so two modules with the same class name in
different files collide. This is rare; if it happens, give one of them a
distinct class name. The alternative — a `name` field in `@Module()` — is not
implemented, and adding it silently would be worse than the constraint.
