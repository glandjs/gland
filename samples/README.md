# Samples

Each sample is a complete, runnable application built around one idea. Read
them in order the first time; after that, jump to whichever one you need.

| Sample                                              | Idea                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [01-simple](01-simple/)                             | One controller, one channel, one typed event. The shape of every Gland app.        |
| [02-modules](02-modules/)                           | Nested modules, lifecycle hooks, and a deliberate dynamic module.                  |
| [03-channels](03-channels/)                         | Channels as the only way to reach other code: `call`, `emit`, typing, and failure. |
| [04-dependency-injection](04-dependency-injection/) | `@Injectable`, `@Inject`, string tokens, and the two ways a container can fail.    |
| [05-adapter](05-adapter/)                           | Writing a protocol adapter, so the core has no transport code.                     |

## Running one

```bash
cd samples/01-simple
pnpm install
pnpm dev
```

Most samples print the working URLs on startup. Set `GLAND_DEBUG=true` to see
the bootstrap trace: module registration, provider resolution, binding, and each
lifecycle phase.

## What they share

Every sample uses the same three pieces, and understanding them once is enough:

```ts
@Module({ /* … */ })   // a unit of composition
@Controller('/x')      // a class whose decorated methods are routes
@Channel('ns')         // a named group of @On() handlers
```

And one rule worth noticing in all of them: a controller never imports the
channel it calls. That is not a style preference — it is what lets the same
handlers serve a different transport later, or move behind a network boundary,
without the caller changing.

## About the adapter

Samples import `@glandjs/express`, which lives in the separate
[glandjs/http](https://github.com/glandjs/http) repository. `samples/` is
excluded from the root typecheck until that adapter is updated to the current
`BrokerAdapter` signature. Sample 05 is the exception: it defines its own
adapter against `@glandjs/core` alone, so it has no such dependency and always
typechecks.
