# Lifecycle

A provider may implement any of five hooks. All are optional, and Gland detects
them structurally — there is no base class and no registration call.

```ts
@Injectable()
export class Pool {
  async onModuleInit() {
    this.client = await connect();
  }
  async onModuleDestroy() {
    await this.client?.close();
  }
}
```

## The hooks

| Hook                     | When                          | Runs for                       |
| ------------------------ | ----------------------------- | ------------------------------ |
| `onModuleInit`           | after the graph is registered | modules, controllers, channels |
| `onChannelInit`          | after channels are bound      | modules, controllers, channels |
| `onAppBootstrap`         | last phase of startup         | modules, controllers, channels |
| `onAppShutdown(signal?)` | start of shutdown             | modules, controllers, channels |
| `onModuleDestroy`        | end of shutdown               | modules, controllers, channels |

## Order

```
create()
  ├─ 1  register           providers constructed
  ├─ 2  onModuleInit
  ├─ 3  bind               channels subscribed, routes broadcast
  ├─ 4  onChannelInit
  └─ 5  onAppBootstrap     -> create() resolves

shutdown()
  ├─ onAppShutdown(signal)
  └─ onModuleDestroy
```

Phases are strictly sequential — each is fully awaited before the next begins.
Within a phase, providers run concurrently.

That ordering is the contract, and it is worth relying on:

- `onModuleInit` runs before anything is bound, so it is the place to open a
  connection or read config
- `onChannelInit` runs after binding, so a provider can rely on its channels
  being reachable
- `onAppBootstrap` is for work that needs the whole application, such as
  warming a cache or announcing readiness

## Async hooks

Return a promise and the phase waits for it:

```ts
@Injectable()
export class Migrator {
  async onModuleInit() {
    await this.connection.query('CREATE TABLE IF NOT EXISTS products (...)');
  }
}
```

A hook that rejects does not abort the phase. The failure is logged and the
remaining hooks still run.

## Failures

A hook that throws is caught, logged, and skipped:

```ts
class Flaky {
  onModuleInit() {
    throw new Error('nope');
  } // logged; startup continues
}
```

For startup-critical work, fail inside `GlandFactory.create()`'s promise chain
rather than from a hook, so the process does not come up half-initialised
without saying so. Hook failures are reported, not fatal.

## Module classes

Module classes participate too, and against the instance the container built —
so they have their dependencies:

```ts
@Module({ imports: [ProductModule] })
export class AppModule {
  constructor(private readonly config: Config) {}

  onModuleInit() {
    this.config.validate();
  }
}
```

## Shutdown

```ts
const { app, shutdown } = await GlandFactory.create(AppModule);

await shutdown('SIGTERM');
```

Runs `onAppShutdown` with the signal, then `onModuleDestroy`, then releases the
process handlers. Idempotent, and never rethrows — shutdown runs on a signal
path, where an escaping error would skip the remaining hooks.

To close adapter resources too, do it after:

```ts
const stop = async (signal: string) => {
  await shutdown(signal);
  await express.close();
  process.exit(0);
};
```

## Signals and error reporting

`ProcessHooks` installs handlers for `SIGTERM`, `SIGINT` and `SIGHUP`, plus
reporters for `uncaughtException` and `unhandledRejection`.

The two are treated differently on purpose:

- a **signal** means shutting down → run the hooks, then exit
- an **unhandled rejection** is a bug in application code → log it, keep running

A framework that exits on every stray promise hides the bug and takes the
service down with it.

Configure it:

```ts
await GlandFactory.create(AppModule, {
  processHooks: {
    signals: ['SIGTERM', 'SIGINT'],
    exitOnSignal: false, // do not exit after a signal
    reportErrors: true, // log uncaught exceptions and rejections
  },
});
```

Handlers are registered once and removed on shutdown, so repeated
`create()` calls in a test suite do not accumulate listeners.

## When not to use a hook

If the work can happen in a constructor, do it there. Hooks exist for work that
must be _ordered_ with respect to binding or shutdown, not as a general
initialisation slot.
