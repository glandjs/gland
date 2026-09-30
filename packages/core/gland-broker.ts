import { EventBroker, type EventRecord } from '@glandjs/events';
import type { BrokerAdapterClass } from './adapter';
import type { ApplicationBinder } from './application/application-binder';
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
   * Releases the core bus and detaches every adapter.
   *
   * @param signal - forwarded to `onAppShutdown`
   */
  public shutdown(signal?: string): void {
    this.broker.shutdown();
    this.adapters.length = 0;
  }
}
