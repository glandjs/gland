import type { Constructor } from '@medishn/toolkit';
import type { Broker, EventRecord } from '@glandjs/events';

/**
 * The contract a protocol adapter implements to plug into Gland.
 *
 * An adapter contributes two things: its own broker, which the core bus links
 * to so the adapter can call channels and receive route broadcasts, and an
 * `initialize()` that returns whatever the application will drive — an HTTP
 * server, a queue consumer, a WebSocket server.
 *
 * Nothing in `@glandjs/core` knows a given adapter exists, which is what keeps
 * the core transport-agnostic.
 *
 * @typeParam TEvents - the event map the adapter's broker is typed with
 * @typeParam TApp - the application instance handed back to the caller
 * @typeParam TOptions - adapter-specific construction options
 *
 * @example
 * ```ts
 * class MyAdapter extends BrokerAdapter<MyEvents, MyApp, MyOptions> {
 *   public broker = new EventBroker<MyEvents>({ name: 'my-protocol' });
 *   public initialize() {
 *     this.broker.on('gland:define:route', ({ meta, action }) => this.register(meta, action));
 *     return this.app;
 *   }
 * }
 * ```
 */
export abstract class BrokerAdapter<TEvents extends EventRecord = EventRecord, TApp = unknown, TOptions = unknown> {
  /**
   * The adapter's own broker.
   *
   * Typed as `Broker<TEvents>` rather than an intersection with the core's
   * event map: an adapter broker is an ordinary broker over whatever event map
   * the adapter cares about, and forcing it to satisfy `GlandEvents` made a
   * plain `EventBroker<EventRecord>` an illegal assignment for no benefit. The
   * `on('gland:define:route', …)` subscription below is the actual contract,
   * and it is enforced by the route broadcast reaching this broker.
   *
   * Assigned by the concrete adapter — declared abstract so
   * {@link GlandBroker.connectTo} can link and initialise it generically.
   */
  public abstract broker: Broker<TEvents>;

  /** The adapter's application instance. Assigned during construction. */
  public instance!: TApp;

  /**
   * Wires the adapter up and returns its application.
   *
   * Called by {@link GlandBroker.connectTo} after the brokers are linked, so
   * route broadcasts published later are guaranteed to reach the adapter.
   */
  public abstract initialize(): TApp;

  constructor(protected readonly options?: TOptions) {}
}

/** Constructor type of a {@link BrokerAdapter}, for `connectTo()`. */
export type BrokerAdapterClass<TEvents extends EventRecord, TApp, TOptions> = Constructor<BrokerAdapter<TEvents, TApp, TOptions>>;
