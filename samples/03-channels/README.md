# 03 — Channels

The core idea, taken seriously: application code reaches other application code
by name, not by import.

```bash
pnpm install
pnpm dev
```

```
POST /orders
  order placed            -> o1 for Ada Lovelace

GET /orders/:id/price
  subtotal 140  discount 21  total 119
  over the threshold?     -> true

Two channels, one controller
  reserve 1x KBD-01       -> true
  reserve 99x MON-27      -> false (insufficient stock for MON-27)
  MON-27 after the failure-> 3 left

What the audit channel saw
  order.placed   o1 for Ada Lovelace
  order.priced   o1 total 119

The cost of names in strings
  Unknown channel event "audit:recd".
  valid: orders:place, orders:find, orders:price… (8 total)
```

## `call` and `emit` are the same thing with a different ending

```ts
const order = await ctx.call('orders:place', input); // returns the value
ctx.emit('audit:record', entry); // discards it
```

Both invoke the handler. Use `call` when you need what comes back, `emit` for
side effects. The audit trail is written with `emit` because nobody is waiting
for a line in a log.

## Nothing imports anything it talks to

`order.controller.ts` imports neither `OrderChannel` nor `AuditChannel`. It has
the event names, and nothing else.

That is a real trade, and the last section of the output is what it costs: a
typo in a name is a **runtime** error rather than a compile one. What it buys
is that the audit module could be deleted without touching a line of order code,
and the same controller would serve a WebSocket or a queue consumer unchanged.

The mitigation is that a miss throws and lists the valid names:

```
UnknownEventError: Unknown channel event "audit:recd".

Known channel events:
  orders:place
  orders:find
  ...
```

A silent `undefined` would be far worse — it would surface three frames later
as something unrelated.

## Namespaces make same-suffix events distinct

`@Channel('orders')` + `@On('place')` is addressed as `orders:place`. Two
channels can both declare a handler called `find` and neither shadows the other,
because the namespace is part of the name. A duplicated _full_ name is a
startup error naming both owners.

## Services versus channels

```ts
@Injectable()
export class DiscountPolicy {
  /* … */
}

@Channel('orders')
export class OrderChannel {
  constructor(private readonly discounts: DiscountPolicy) {}
}
```

`DiscountPolicy` is injected; it has no namespace. The rule: **only things
something else must address need a channel.** A rule with no callers other than
one class is a service.

## One payload, one argument

`ctx.call` passes exactly one payload, so a handler takes an object rather than
positional parameters:

```ts
@On('reserve')
reserve(input: { sku: string; quantity?: number }) { /* … */ }
```

A handler written as `reserve(sku, quantity)` would read correctly and silently
receive `undefined` for the second argument at runtime. Objects make the shape
explicit, and the event map enforces it:

```ts
'inventory:reserve': IOEvent<{ sku: string; quantity?: number }, ReserveResult>;
```

## Files

| File                                     | Contents                                        |
| ---------------------------------------- | ----------------------------------------------- |
| `src/app.module.ts`                      | The event map, and the three modules            |
| `src/modules/orders/order.controller.ts` | Routes that call channels by name               |
| `src/modules/orders/orders.channel.ts`   | `orders:*` and `inventory:*`                    |
| `src/modules/orders/discount.policy.ts`  | A rule as an injected service                   |
| `src/modules/audit/audit.channel.ts`     | A concern nothing imports                       |
| `src/main.ts`                            | Drives the controller and shows the audit trail |
