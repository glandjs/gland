/**
 * A protocol adapter, built against `@glandjs/core` alone.
 *
 * This sample exists to show that the framework has no transport code in it.
 * Everything below is what it takes to teach Gland a new protocol: own a
 * broker, subscribe to the route broadcast, and hand back an application.
 *
 * The "protocol" here is deliberately trivial — a router that logs — but the
 * shape is the same one `@glandjs/express` uses to register routes on Express.
 */

import { GLAND_ROUTE_EVENT, type GlandRoute } from '@glandjs/common';
import { BrokerAdapter, type BrokerAdapterClass } from '@glandjs/core';
import { EventBroker, type Broker, type EventRecord } from '@glandjs/events';

/** One route, as this adapter understands it. */
export interface RegisteredRoute {
  method: string;
  path: string;
  handler: GlandRoute['action'];
}

/**
 * The application this adapter hands back.
 *
 * A real adapter would expose `use()`, `listen()`, `close()`. This one exposes
 * the route table, because that is the part the framework is actually
 * interested in.
 */
export class ConsoleApplication {
  constructor(public readonly routes: RegisteredRoute[]) {}

  /** Renders the route table the way a router would list it. */
  describe(): string[] {
    return this.routes.map((route) => `${route.method.padEnd(6)} ${route.path}`).sort((a, b) => a.localeCompare(b));
  }

  /** Finds the first route matching a method and path. */
  match(method: string, path: string): RegisteredRoute | undefined {
    return this.routes.find((route) => route.method === method && route.path === path);
  }
}

/**
 * Teaches Gland to speak a new protocol.
 *
 * Three responsibilities, in order:
 *
 * 1. contribute a broker, which `GlandBroker.connectTo` links to the core bus
 * 2. subscribe to `gland:define:route` before the binder replays the route log
 * 3. return whatever the application will drive
 */
export class ConsoleBroker extends BrokerAdapter<EventRecord, ConsoleApplication, { name?: string }> {
  /** Assigned in the constructor; the base class only declares it abstract. */
  public broker: Broker<EventRecord>;

  private readonly registered: RegisteredRoute[] = [];

  constructor(options?: { name?: string }) {
    super(options);
    this.broker = new EventBroker<EventRecord>({ name: options?.name ?? 'console' });
  }

  /**
   * Runs once, after the brokers are linked.
   *
   * Subscribing here rather than in the constructor is what makes the route
   * replay effective: `GlandBroker.connectTo` calls `initialize()` first, then
   * re-publishes every route the binder discovered.
   */
  public initialize(): ConsoleApplication {
    this.broker.on(
      GLAND_ROUTE_EVENT as never,
      ((route: GlandRoute) => {
        this.registered.push({
          method: route.method,
          path: route.fullPath,
          handler: route.action,
        });
      }) as never,
    );

    return new ConsoleApplication(this.registered);
  }
}

/**
 * Constructor type accepted by `GlandBroker.connectTo`.
 *
 * `connectTo` takes a class, not an instance, so this is what the sample
 * passes. Without it TypeScript cannot infer `TApp` from a class expression.
 */
export type ConsoleBrokerClass = BrokerAdapterClass<EventRecord, ConsoleApplication, { name?: string }>;
