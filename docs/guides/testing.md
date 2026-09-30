# Testing

## Why ts-node, not tsx

`emitDecoratorMetadata` only writes `design:paramtypes` for **decorated**
classes, and it is a TypeScript compiler feature. A transform-only runner such
as esbuild (which `tsx` uses) does not implement it, so a test run under `tsx`
sees no constructor metadata and every injection fails.

That is why this suite runs under `ts-node`, configured by
`tsconfig.test.json`:

```jsonc
{
  "extends": "./tsconfig.json",
  "ts-node": {
    "compilerOptions": {
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true,
    },
  },
}
```

```bash
pnpm test:unit
pnpm test:integration
```

## Unit tests

Build the smallest graph that proves the behaviour.

### A container

```ts
import { Container } from '@glandjs/core';

it('shares one instance', () => {
  @Injectable()
  class Service {}

  const container = new Container();
  expect(container.resolve(Service)).to.equal(container.resolve(Service));
});
```

### Discovery

```ts
@Channel('db')
class Database {
  @On('product:find')
  find() {}
}

const explorer = new Explorer(container.moduleContainer);
expect(explorer.exploreChannels()).to.have.lengthOf(1);
```

### Binding

Build a real broker and assert on what reached it — that is where the interesting
failures used to be.

```ts
const broker = new EventBroker({ name: 'core' });
const binder = new ApplicationBinder(explorer, broker, new ChannelRegistryBuilder());
binder.bind();

expect(broker.call('gland:define:channel:db:product:find', 'p1')).to.equal(/* … */);
```

## Integration tests

Boot a real application and drive it through a stub adapter. This is the only
way to catch wiring bugs — the ones that unit tests miss because each piece works
alone.

```ts
class TestAdapter extends BrokerAdapter<any, Registered[], any> {
  public broker = new EventBroker({ name: 'test-adapter' });
  public registered: Registered[] = [];

  public initialize() {
    this.broker.on('gland:define:route', (payload) => {
      this.registered.push({ method: payload.method, path: payload.fullPath, action: payload.action });
    });
    return this.registered;
  }
}

const { app } = await GlandFactory.create(AppModule, { processHooks: { signals: [] } });
const registered = app.connectTo(TestAdapter);
const ctx = new Context(app.broker);

registered[0].action(ctx); // invoke a route exactly as an adapter would
```

`processHooks: { signals: [] }` keeps the suite from installing process handlers
that would outlive the test.

## Testing a channel

Invoke the registered broker event directly, rather than reaching past the
public API:

```ts
binder.bind();
expect(broker.call('gland:define:channel:db:product:find', id)).to.deep.equal(product);
```

## Testing an unknown event

```ts
expect(() => ctx.call('db:product:fnd', id)).to.throw(/Unknown channel event/);
expect(() => ctx.call('db:product:fnd', id)).to.throw(/db:product:find/);
```

The second assertion matters: it checks the error names the real events, which
is what makes the failure actionable.

## Fixtures

Prefer a fresh graph per test over sharing one. The container is designed to be
cheap:

```ts
beforeEach(async () => {
  container = new Container();
  await container.register(TestModule);
  explorer = new Explorer(container.moduleContainer);
});
```

Shared mutable module-level state is the usual source of order-dependent
failures — a singleton channel holding a `Map` that is never cleared will fail
the second test that asserts on its contents.

## What to assert

The regressions worth guarding are behavioural, not structural:

| Assert                                            | Guards against                             |
| ------------------------------------------------- | ------------------------------------------ |
| `this` is the instance inside a handler           | handlers running with `this === undefined` |
| a late adapter receives all routes                | routes lost to bootstrap ordering          |
| same-suffix events in two namespaces both resolve | suffix-only name matching                  |
| an unknown event throws with the list             | silent `undefined` from a typo             |
| the registry is the same object across requests   | per-request copying                        |
| hooks run against the container's instance        | discarded module instances                 |

## Coverage

```bash
pnpm coverage
```

The interesting units — `Container`, `Explorer`, `ApplicationBinder`, `Context`,
`LifecycleScanner`, `ProcessHooks` — are covered directly. The integration suite
covers `GlandFactory.create` end to end, including its failure paths.
