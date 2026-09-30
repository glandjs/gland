# 05 — Writing an adapter

The core has no transport code in it. This sample shows what filling that gap
looks like.

```bash
pnpm install
pnpm dev
```

```
  Routes discovered

    GET    /greet/:name

  Invoked /greet/:name  ->  {"text":"Hello, World.","shouted":false}
```

## The whole adapter

Three responsibilities. That is the entire extension surface.

```ts
// 1. contribute a broker
this.broker = new EventBroker({ name: 'console' });

// 2. subscribe to the route broadcast
this.broker.on('gland:define:route', (route) => {
  this.registered.push({ method: route.method, path: route.fullPath, handler: route.action });
});

// 3. return whatever the application will drive
return new ConsoleApplication(this.registered);
```

`@glandjs/express` does exactly this and then calls
`this.instance[method](path, action)` on an Express app. Swapping the last line
for `queue.consume(path, action)` would produce a queue adapter.

## Two things the sample makes concrete

**Subscribe in `initialize()`, not the constructor.** `GlandBroker.connectTo`
calls `initialize()` _before_ replaying the route log. A subscription made
earlier would be live, but one made later would miss the replay.

```ts
public connectTo(AdapterClass, options) {
  const adapter = new AdapterClass(options);
  adapter.broker.connectTo(this.broker);   // link
  const app = adapter.initialize();        // subscribe
  this.binder?.replayRoutes(adapter.broker);  // then catch it up
  return app;
}
```

Adapters connect _after_ bootstrap, because they need the application handle in
order to configure themselves. That ordering is why the replay exists at all:
without it, every adapter would come up with no routes.

**`initialize()` returns the application, and the caller keeps it.** `connectTo`
hands it straight back, so `app.connectTo(ExpressBroker)` yields the Express
app, ready for `.listen()`.

## `Context` is the framework's, routing is the adapter's

```ts
const ctx = new Context(app.broker) as Context<any> & { params: { name: string } };
ctx.params = { name: 'World' };
await greeting.handler(ctx);
```

`Context` provides `call`, `emit` and `state`. It knows nothing about paths,
params or methods — an HTTP adapter layers those on as a subclass. The
`as … & { params }` intersection is what an application does to name a
parameter its adapter provides.

## Files

| File                    | Contents                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| `src/console-broker.ts` | The adapter: broker, subscription, route table                        |
| `src/greeter.ts`        | Two services, showing the singleton rule                              |
| `src/app.module.ts`     | A local `Get()` decorator, written against the metadata keys directly |
| `src/main.ts`           | Boot, attach, list the routes, invoke one                             |

`app.module.ts` writes its own `Get()` rather than importing `@Get()` from
`@glandjs/http`, which is what lets this sample depend on `@glandjs/core` alone
and always typecheck.
