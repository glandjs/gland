import type { ChannelRegistry } from '@glandjs/common';
import {
  type Broker,
  type CallMethod,
  type EmitMethod,
  type EventOptions,
  type EventPayload,
  type EventRecord,
  type EventReturn,
  type Events,
  type Listener,
  type OffMethod,
  type OnMethod,
  type OnceMethod,
} from '@glandjs/events';
import type { Dictionary } from '@medishn/toolkit';

/**
 * State key under which the binder publishes the channel registry.
 * @internal
 */
export const CHANNEL_STATE_KEY = 'channel';

/**
 * State key under which the binder publishes the serving broker's id.
 * @internal
 */
export const BROKER_ID_STATE_KEY = 'brokerId';

/** Thrown when an event name is not present in the channel registry. */
export class UnknownEventError extends Error {
  constructor(
    public readonly event: string,
    public readonly available: readonly string[],
  ) {
    const hint = available.length ? `\n\nKnown channel events:\n  ${available.join('\n  ')}` : '\n\nNo channels are registered in this application.';
    super(`Unknown channel event "${event}".${hint}`);
    this.name = 'UnknownEventError';
  }
}

/**
 * A shallow, mutable bag of per-request values.
 *
 * Assigning merges rather than replaces, so `ctx.state = { a: 1 }` twice does
 * not drop `b`.
 */
export interface ContextState extends Dictionary<any> {}

/**
 * Maximum number of suggestions listed in an {@link UnknownEventError}.
 * @internal
 */
const MAX_SUGGESTIONS = 40;

/**
 * The object handed to a route handler.
 *
 * A context wraps the broker and adds two ways of reaching application code:
 *
 * - {@link Context.emit} — invoke a channel handler, ignore the result
 * - {@link Context.call} — invoke a channel handler, return its result
 *
 * Resolution is an O(1) lookup in the registry the binder froze during
 * bootstrap. The previous implementation scanned a per-request array of
 * channel descriptors and compared only the segment after the first colon,
 * so two channels declaring the same suffix in different namespaces silently
 * resolved to whichever was discovered first. A miss is now a hard error that
 * lists the events that do exist.
 *
 * @typeParam TEvents - the event map, used to type payloads and return values
 *
 * @example
 * ```ts
 * @Get(':id')
 * async find(ctx: Context<EventTypes>) {
 *   const product = await ctx.call('db:product:find', { id: ctx.params.id });
 *   ctx.emit('analytics:viewed', { id: ctx.params.id });
 *   return product;
 * }
 * ```
 */
export class Context<TEvents extends EventRecord> implements CallMethod<TEvents>, OnMethod<TEvents>, EmitMethod<TEvents>, OnceMethod<TEvents>, OffMethod<TEvents> {
  private _state: ContextState = {};

  /** Populated by adapters when a handler throws. */
  public error?: unknown;

  constructor(protected readonly broker: Broker<TEvents>) {}

  /** The per-request state bag. Assignment merges into the existing value. */
  get state(): ContextState {
    return this._state;
  }

  set state(data: ContextState) {
    this._state = Object.assign(this._state, data);
  }

  /**
   * Merges `data` into the state bag.
   *
   * The explicit form of the `state` setter, for call sites where the intent
   * is a merge rather than an assignment.
   */
  public setState(data: ContextState): this {
    this.state = data;
    return this;
  }

  /**
   * Publishes the channel registry and broker id the binder prepared.
   *
   * Called by the binder before the handler runs. The registry is shared and
   * frozen, so this stores a reference rather than copying per request.
   *
   * @internal
   */
  public attachRegistry(brokerId: string, registry: ChannelRegistry): this {
    this._state[BROKER_ID_STATE_KEY] = brokerId;
    this._state[CHANNEL_STATE_KEY] = registry;
    return this;
  }

  /**
   * Invokes a channel handler and discards its result.
   *
   * Use this for side effects (logging, analytics, cache invalidation). Use
   * {@link Context.call} when you need the handler's return value.
   *
   * @param event - public event name, e.g. `'db:product:create'`
   * @param payload - value handed to the handler
   *
   * @throws {UnknownEventError} when no channel declares `event`
   *
   * @example
   * ```ts
   * ctx.emit('audit:record', { action: 'delete', id });
   * ```
   */
  public emit<K extends Events<TEvents>>(event: K, payload: EventPayload<TEvents, K>, options?: EventOptions): this {
    // Channels are bound on the *core* bus, and the binder stores that bus's
    // id in `ctx.state.brokerId`. Hopping through the adapter broker to reach
    // it would be a no-op for `emitTo`/`callTo`, since those dispatch on the
    // target broker's own listener list — which is where the channel is not.
    this.channelBroker().emit(this.resolveEvent(event) as never, payload as never, options as never);
    return this;
  }

  /**
   * The bus the channel handlers are registered on.
   *
   * `this.broker` is the adapter's broker (an HTTP request enters there);
   * the channels live on the core bus, reachable as a connection of it.
   */
  private channelBroker(): Broker<TEvents> {
    const core = this._state[BROKER_ID_STATE_KEY] as string | undefined;
    if (!core) {
      throw new Error('Context is not attached to an application broker. Was the handler invoked outside the binder?');
    }

    const connections = (this.broker as { getConnection?: (id: string) => Broker<TEvents> | undefined }).getConnection;
    const target = typeof connections === 'function' ? connections.call(this.broker, core) : undefined;

    // Falling back to the local broker keeps a directly-constructed context
    // usable, and matches the single-broker case.
    return target ?? this.broker;
  }

  /**
   * Invokes a channel handler and returns its result.
   *
   * @param event - public event name, e.g. `'db:product:find'`
   * @param data - value handed to the handler
   * @param strategy - `'all'` fans out to every handler and returns an array;
   *                  the default returns the single handler's value
   *
   * @throws {UnknownEventError} when no channel declares `event`
   *
   * @example
   * ```ts
   * const product = await ctx.call('db:product:find', { id });
   * ```
   */
  public call<K extends Events<TEvents>>(event: K, data: EventPayload<TEvents, K>): EventReturn<TEvents, K>;
  public call<K extends Events<TEvents>>(event: K, data: EventPayload<TEvents, K>, strategy: 'all'): EventReturn<TEvents, K>[];
  public call<K extends Events<TEvents>>(event: K, data: EventPayload<TEvents, K>, strategy?: 'all'): EventReturn<TEvents, K> | EventReturn<TEvents, K>[] {
    const broker = this.channelBroker();
    const resolved = this.resolveEvent(event) as never;

    // The `strategy` overloads make the two shapes mutually exclusive at the
    // type level; forwarding it conditionally keeps the runtime value exactly
    // as the caller passed it (including `undefined`).
    return strategy === undefined ? broker.call(resolved, data as never) : broker.call(resolved, data as never, strategy);
  }

  /**
   * Subscribes to a raw broker event.
   *
   * For framework-level observation, not for reaching channel handlers — use
   * {@link Context.call} for that.
   *
   * @returns `this` for chaining, or a promise of the first payload when
   *          `options.watch` is set
   */
  public on<K extends Events<TEvents>>(event: K, listener: Listener<EventPayload<TEvents, K>, void>, options?: EventOptions): this;
  public on<K extends Events<TEvents>>(event: K, listener: null, options: EventOptions & { watch: true }): Promise<EventPayload<TEvents, K>>;
  public on<K extends Events<TEvents>>(event: K, listener: Listener<EventPayload<TEvents, K>, void> | null, options?: EventOptions & { watch?: boolean }): this | Promise<EventPayload<TEvents, K>> {
    // `@glandjs/events` overloads `on` such that the 3-arg form is only
    // reachable with `watch: true`; the watcher form is what the union return
    // type reflects. Confined to this cast so the rest stays typed.
    return this.bridged(this.broker.on(event as never, listener as never, options as never));
  }

  /** Removes a previously registered listener. @see Context.on */
  public off<K extends Events<TEvents>>(event: K, listener?: Listener<EventPayload<TEvents, K>, void>): this {
    this.broker.off(event, listener);
    return this;
  }

  /**
   * Subscribes for a single delivery.
   * @see Context.on
   *
   * @returns `this` for chaining, or a promise of the first payload when
   *          `options.watch` is set
   */
  public once<K extends Events<TEvents>>(event: K, listener: Listener<EventPayload<TEvents, K>, void>): this;
  public once<K extends Events<TEvents>>(event: K, listener: null, options: EventOptions & { watch: true }): Promise<EventPayload<TEvents, K>>;
  public once<K extends Events<TEvents>>(event: K, listener: Listener<EventPayload<TEvents, K>, void> | null, options?: EventOptions & { watch?: boolean }): this | Promise<EventPayload<TEvents, K>> {
    return this.bridged(this.broker.once(event as never, listener as never, options as never));
  }

  /**
   * Resolves a public event name to the broker event backing it.
   *
   * @throws {UnknownEventError} when the name is not registered
   */
  private resolveEvent(event: string): string {
    const registry = this._state[CHANNEL_STATE_KEY] as ChannelRegistry | undefined;
    const fullName = registry?.[event];

    if (!fullName) {
      const available = registry ? Object.keys(registry).slice(0, MAX_SUGGESTIONS) : [];
      throw new UnknownEventError(event, available);
    }

    return fullName;
  }

  /** Id of the core broker serving this request. */
  private requireBrokerId(): string {
    const brokerId = this._state[BROKER_ID_STATE_KEY] as string | undefined;
    if (!brokerId) {
      throw new Error('Context is not attached to an application broker. Was the handler invoked outside the binder?');
    }
    return brokerId;
  }

  /**
   * Normalises the broker's `this | Promise` return into the context's own
   * `this | Promise` contract.
   *
   * `@glandjs/events` types `on`/`once` as returning `this`, but returns a
   * promise when `options.watch` is set. The cast is confined to this one
   * place so the rest of the class stays fully typed.
   */
  private bridged<T>(result: unknown): T | this {
    return (result instanceof Promise ? result : this) as T | this;
  }
}
