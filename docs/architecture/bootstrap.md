# Bootstrap sequence

This is what `await GlandFactory.create(AppModule)` actually does. Every step
below is awaited before the next begins, which is what makes the call safe to
follow with `listen()`.

## 0. Construction

```ts
const logger = new Logger({ context: 'Gland' });
const app = new GlandBroker(); // EventBroker named '@glandjs/core'
const initial = new ApplicationInitial(app.broker, logger, debug, processHooks);
initial.onBound = (binder) => app.attachBinder(binder);
```

`GlandBroker` sets `maxListeners: 100` rather than the events package's default
of 5. Every attached adapter subscribes to the route broadcast, so a small
number of protocols would otherwise exhaust the limit for no good reason.

## 1. Scan the module graph

`DependenciesScanner.scan(root)` → `Container.register(root)`.

Registration is recursive and idempotent:

1. normalise the input into `{ moduleClass, metadata }` — a dynamic module's
   arrays are _merged_ with the class's `@Module()` metadata
2. if the token is already registered, return it
3. construct the module class itself through `resolve()` — so it joins the
   singleton cache and the cycle guard like any other provider
4. push the token onto the resolution stack
5. register each import (recursively)
6. resolve and attach each controller
7. resolve and attach each channel
8. pop the stack

Registration is transitive and diamond-safe: a module reached through two
parents is registered once, and `ModuleRef.imports` is a `Set`.

### Errors at this stage

| Error                         | Cause                                                                |
| ----------------------------- | -------------------------------------------------------------------- |
| `CircularDependencyError`     | provider or module imports form a cycle; the message names the chain |
| `UnresolvableDependencyError` | a parameter has no usable token (see below)                          |

## 2. Discover

```ts
const explorer = new Explorer(modules, logger);
const registry = new ChannelRegistryBuilder();
this.lifecycle = new ApplicationLifecycle(modules, logger, processHooksOptions);
```

`ApplicationLifecycle`'s constructor installs the process hooks — but only when
a logger is available, since reporting errors needs somewhere to report.

## 3. `onModuleInit`

`LifecycleScanner.scanForHooks()` walks every module and records the providers
that implement any lifecycle hook, then `onModuleInit` runs on all of them.

Module classes are scanned too, using the instance the container already built.
An earlier implementation called `new module.metatype()`, which handed hooks a
throwaway object with no injected dependencies — so whatever a module set up in
its constructor was silently discarded.

## 4. Bind

`ApplicationBinder.bind()` does two things.

### Channels first

For every `@On()` handler:

```ts
const binding = registryBuilder.add(namespace, event, ownerName);
broker.on(binding.fullName, (...args) => target.apply(instance, args));
```

`ChannelRegistryBuilder.add` throws on a duplicate public name. Two channels
declaring the same `namespace:event` used to both bind, with whichever was
discovered first silently answering for both — one of them simply unreachable,
with no diagnostic.

Note `target.apply(instance, args)`: the handler was extracted as a bare
prototype function, so `this` has to be restored explicitly.

After channels, `registryBuilder.freeze()` produces the immutable
`publicName -> brokerEvent` record shared by every request.

### Then routes

For every decorated controller method:

```ts
routeLog.push({
  path: handlerPath,
  fullPath: combineRoutePath(controllerPrefix, handlerPath),
  method: method.toUpperCase(),
  action: (ctx) => {
    ctx.attachRegistry(brokerId, registry);
    return target.call(instance, ctx);
  },
});

broker.broadcast('gland:define:route', payload);
```

The payload is pushed to `routeLog` as well as broadcast. `GlandBroker.connectTo()`
replays that log to any adapter attaching later — otherwise an adapter, which by
necessity attaches after bootstrap, would receive no routes at all.

## 5. `onChannelInit`

Runs after binding, so a provider that needs to know its channels are reachable
can rely on it.

## 6. `onAppBootstrap`

The last phase. After this, `create()` resolves.

## 7. Attaching an adapter

```ts
const express = app.connectTo(ExpressBroker);
```

1. construct the adapter
2. `adapter.broker.connectTo(coreBroker)` — the link is bidirectional
3. `adapter.initialize()` — the adapter subscribes to `gland:define:route`
4. `binder.replayRoutes(adapter.broker)` — the routes it missed
5. return the adapter's application handle

Order matters at step 3/4: subscribing before replaying is what makes the
replay effective.

## Failure behaviour

A failure at any stage aborts `create()` and rethrows. Bootstrap problems
surface at startup, where a stack trace and a logger exist — never on the first
request, where they surface as a timeout in someone else's error.

## What the caller gets

```ts
const { app, shutdown } = await GlandFactory.create(AppModule);

app.id; // '@glandjs/core'
app.connectTo(); // attach an adapter
app.broker; // the core bus
shutdown(signal); // run onAppShutdown + onModuleDestroy, release process hooks
```
