# Channels

A channel is a named group of event handlers. Channels are how application code
reaches other application code without holding references to it.

## Declaring

```ts
import { Channel, On } from '@glandjs/common';

@Channel('db')
export class Database {
  @On('product:find')
  find(id: string): Product | null {
    return this.products.get(id) ?? null;
  }

  @On('product:create')
  create(input: NewProduct): Product {
    const product = { id: nextId(), ...input };
    this.products.set(product.id, product);
    return product;
  }
}
```

`@Channel('db')` namespaces the class. `@On('product:find')` names one handler
inside it.

## Addressing

The public name is the namespace and the event joined by a colon:

```ts
@Channel('db')  +  @On('product:find')   ->   'db:product:find'
```

`ctx.call()` and `ctx.emit()` take that name.

### Unnamespaced channels

```ts
@Channel()             // namespace is ''

@On('ping')            // addressed as 'ping'
ping() { return 'pong'; }
```

The namespace segment is omitted rather than stringified — the earlier template
literal produced the literal event name `gland:define:channel:undefined:ping`.

## Calling

```ts
// Return the handler's value.
const product = await ctx.call('db:product:find', id);

// Fire and forget.
ctx.emit('audit:record', { action: 'create', id });
```

`call` and `emit` both invoke the handler. The difference is only what happens
to the result: `call` hands it back, `emit` discards it. Use `emit` for side
effects and `call` when you need a value.

With a `'all'` strategy, `call` returns an array:

```ts
const results = await ctx.call('db:product:find', id, 'all');
```

## Uniqueness

Every public name must be globally unique. A collision is a startup error:

```
Duplicate channel event "db:product:create".
  already declared by: Database (gland:define:channel:db:product:create)
  redeclared by:        Cache
```

The same suffix in _different_ namespaces is fine and unambiguous:

```ts
@Channel('db')   @On('create')   // 'db:create'
@Channel('cache') @On('create')   // 'cache:create'
```

Both stay reachable. An earlier implementation compared only the text after the
first colon, which made these two indistinguishable and silently routed calls
to whichever was discovered first.

## Unknown events

An unregistered name throws, and the error lists what does exist:

```
Unknown channel event "db:product:fnd".

Known channel events:
  db:product:create
  db:product:find
  db:product:all
```

This is a deliberate change from returning `undefined`. A typo in an event name
is a bug, and surfacing it at the call site — with the valid names — beats
discovering it as a mysterious `undefined` three frames later.

## Naming

Namespacing by _role_ keeps call sites readable and makes the topology obvious:

```ts
@Channel('db')      // persistence
@Channel('cache')   // caching
@Channel('audit')   // side effects
@Channel('mail')    // outbound
```

Include the entity in the event name, not the channel:

```ts
@On('product:find')    // good
@On('find')            // ambiguous once a second entity appears
```

## Typed events

`ctx.call` and `ctx.emit` are typed by the context's event map, so payloads and
return values are checked:

```ts
import type { IOEvent } from '@glandjs/events';

export interface EventTypes {
  'db:product:find': IOEvent<string, Product | null>;
  'db:product:create': IOEvent<NewProduct, Product>;
}

const product = await ctx.call('db:product:find', id); // Product | null
ctx.call('db:product:find', { wrong: true }); // compile error
```

## Where handlers run

Channel listeners are bound on the **core** bus. A request enters the adapter's
bus, so `Context` resolves the core bus through its connection before
dispatching. Dispatching locally would find no listener and quietly return
nothing — which is precisely the bug this indirection exists to make
impossible.

## Lifecycle

A channel can implement `onChannelInit`, which runs after all channels are
bound:

```ts
@Channel('db')
export class Database implements OnChannelInit {
  onChannelInit() {
    this.pool = createPool();
  }
}
```
