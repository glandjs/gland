# 02 — Modules

Composition, transitive registration, and the lifecycle order.

```bash
pnpm install
pnpm dev
```

```
Bootstrap, in order
  [AppModule] onModuleInit
  [CatalogModule] onModuleInit
[CatalogChannel] onModuleInit
[UsersChannel] onModuleInit
  [CatalogModule] onAppBootstrap

Transitive registration
  catalog:find('KBD-01')  -> {"sku":"KBD-01","title":"Mechanical keyboard","price":140}
  pricing:apply(item)     -> finalPrice 140

Two namespaces, one suffix
  users:find('u1')        -> {"id":"u1","name":"Ada Lovelace"}

An unknown event
  UnknownEventError: Unknown channel event "catalog:fin".
  listed: catalog:list, catalog:find, pricing:apply, users:find, users:count
```

## Only the root names anything

```
AppModule
├── CatalogModule          channels: [CatalogChannel]
│   └── PricingModule      channels: [PricingChannel]
└── UsersModule            channels: [UsersChannel]
```

`AppModule` names two modules. `PricingModule` is named only by its parent, and
it still gets registered — imports are transitive. The root never has to know
that a pricing module exists, which is what makes a feature self-contained.

Registration is also **diamond-safe**: a module reached through two parents is
registered once, and both parents reference the same instance.

## The order is the contract

The console output above is the point of the sample. Phases are strictly
sequential, and each is fully awaited before the next:

| Phase | What                                               |
| ----- | -------------------------------------------------- |
| 1     | register — every provider constructed              |
| 2     | `onModuleInit` — open connections, validate config |
| 3     | bind — channels subscribed, routes broadcast       |
| 4     | `onChannelInit` — channels are now reachable       |
| 5     | `onAppBootstrap` — warm caches, announce readiness |

`onModuleInit` runs before anything is bound, so it is the wrong place to reach
for a channel. `onChannelInit` is the earliest moment a provider can rely on
every channel in the application being reachable.

A module class participates too, and against **the instance the container
built** — with its dependencies injected. An earlier implementation instantiated
a second copy for hook scanning and threw the real one away.

## A module is a provider

```ts
@Module({ imports: [CatalogModule], channels: [CatalogChannel] })
class CatalogModule {
  constructor(private readonly config: Config) {}
  onModuleInit() {
    this.config.validate();
  }
}
```

## Two namespaces, one suffix

`catalog:find` and `users:find` both end in "find" and stay distinct, because
the namespace is part of the name. An earlier implementation compared only the
text after the first colon, which made the two indistinguishable — whichever was
discovered first silently answered for both.

## Typed events

```ts
interface AppEvents {
  'catalog:find': IOEvent<string, CatalogItem | null>;
  'users:find': IOEvent<string, User | null>;
}
```

`ctx.call('catalog:find', 'KBD-01')` is typed as `CatalogItem | null`, and a
wrong payload is a compile error.

## Calling outside a request

`createContext` wires the channel registry the way the binder does for an HTTP
request. It is what makes a CLI command, a scheduled job, or a test able to call
a channel without a transport in the way.

```ts
const { app } = await GlandFactory.create(AppModule);
const ctx = app.createContext<AppEvents>();
const item = await ctx.call('catalog:find', 'KBD-01');
```
