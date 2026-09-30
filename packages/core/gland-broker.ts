import type { GlandEvents } from '@glandjs/common';
import { EventBroker, type Broker, type EventRecord } from '@glandjs/events';
import type { BrokerAdapterClass } from './adapter';
import type { ApplicationBinder } from './application/application-binder';
import { Context } from './context';
import type { TGlandBroker } from './types/gland-broker.type';

/**
 * The core message bus every adapter attaches to.
 *
 * Gland's extension model is a mesh of brokers: this one owns the application
 * bus, and each protocol adapter contributes a broker of its own that
 * {@link GlandBroker.connectTo} links to it. Routes and channel handlers are
 * published on the core bus, so an adapter only has to subscribe to learn
 * about them.
 *
 * @example
 * ```ts
 * const app = new GlandBroker();
 * const http = app.connectTo(ExpressBroker, { port: 3000 });
 * ```
 */
export class GlandBroker {
  /**
   * The application's event bus.
   *
   * Its id must stay stable: it is what a request context stores in
   * `ctx.state.brokerId` and uses to reach channels.
   */
  public readonly broker: TGlandBroker;

  /** Ids of the adapters attached so far, in attachment order. */
  private readonly adapters: string[] = [];

  /**
   * The binder that ran during bootstrap, if any.
   *
   * Retained so a late-attaching adapter can be handed the routes it missed;
   * they were broadcast before it subscribed.
   */
  private binder?: ApplicationBinder;

  constructor(options: { name?: string; maxListeners?: number; cacheSize?: number } = {}) {
    this.broker = new EventBroker({
      name: options.name ?? '@glandjs/core',
      // The default of 5 is tight for a broadcast bus: every attached adapter
      // subscribes to `gland:define:route`, so an app with a handful of
      // protocols would fail for no good reason.
      maxListeners: options.maxListeners ?? 100,
      cacheSize: options.cacheSize ?? 32,
    }) as TGlandBroker;
  }

  /** Id of the core bus. */
  public get id(): string {
    return this.broker.id;
  }

  /**
   * Attaches a protocol adapter and returns its application instance.
   *
   * Linking is bidirectional: the adapter can publish to the core bus (routes,
   * channel calls) and the core bus can reach the adapter (broadcasts).
   *
   * @param AdapterClass - the adapter to construct
   * @param options - passed to the adapter's constructor
   * @returns the adapter's application instance
   *
   * @example
   * ```ts
   * const express = app.connectTo(ExpressBroker);
   * express.listen(3000);
   * ```
   */
  public connectTo<TEvents extends EventRecord, TApp, TOptions>(AdapterClass: BrokerAdapterClass<TEvents, TApp, TOptions>, options?: TOptions): TApp {
    const adapter = new AdapterClass(options);

    // The adapter's broker is typed with its own event map; linking only needs
    // `connectTo`, which both `Broker` and `EventBroker` expose.
    (adapter.broker as { connectTo: (b: unknown) => void }).connectTo(this.broker);
    this.adapters.push(adapter.broker.id);

    const app = adapter.initialize();

    // Replay routes broadcast before this adapter existed. Adapters normally
    // connect after bootstrap — they need the application handle to configure
    // themselves — so without this they would come up with no routes at all.
    this.binder?.replayRoutes(adapter.broker as never);

    return app;
  }

  /**
   * Records the binder so later adapters can be caught up on routes.
   *
   * @internal Called by `ApplicationInitial` during bootstrap.
   */
  public attachBinder(binder: ApplicationBinder): void {
    this.binder = binder;
  }

  /**
   * Builds a request context already wired to this application's channels.
   *
   * Normally the adapter builds the context and the binder attaches the
   * registry before the handler runs. This is for the cases where that is not
   * the shape of the work: a CLI command, a queue consumer, a scheduled job, or
   * a test that wants to call a channel directly.
   *
   * ```ts
   * const { app } = await GlandFactory.create(AppModule);
   * const ctx = app.createContext();
   * const product = await ctx.call('db:product:find', id);
   * ```
   *
   * @throws if called before bootstrap has bound anything
   *
   * @param broker - the bus to dispatch on; defaults to the core bus
   */
  public createContext<TEvents extends EventRecord = GlandEvents>(broker?: Broker<TEvents>): Context<TEvents> {
    const registry = this.binder?.channelRegistry;
    if (!registry) {
      throw new Error('Cannot create a context before the application has finished binding. Await GlandFactory.create() first.');
    }

    const ctx = new Context<TEvents>((broker ?? this.broker) as unknown as Broker<TEvents>);
    ctx.attachRegistry(this.id, registry);
    return ctx;
  }

  /**
   * Releases the core bus and detaches every adapter.
   *
   * @param signal - forwarded to `onAppShutdown`
   */
  public shutdown(signal?: string): void {
    this.broker.shutdown();
    this.adapters.length = 0;
  }
}
