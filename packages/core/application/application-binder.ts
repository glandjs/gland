import { combineRoutePath, GLAND_ROUTE_EVENT, type ChannelBinding, type ChannelRegistry, type ChannelRegistryBuilder, type GlandRoute } from '@glandjs/common';
import type { Logger } from '@medishn/toolkit';
import type { Explorer } from '../injector';
import type { TGlandBroker } from '../types';

/**
 * Wires discovered controllers and channels onto the broker.
 *
 * Two things happen here, and they are the only two extension points the
 * framework has:
 *
 * - each channel handler becomes a broker listener under
 *   `gland:define:channel:<namespace>:<event>`
 * - each route becomes a `gland:define:route` broadcast carrying the handler
 *   itself, which is how protocol adapters pick routes up without the core
 *   knowing they exist
 */
export class ApplicationBinder {
  private readonly logger?: Logger;
  private frozenRegistry: ChannelRegistry = Object.freeze({});

  /**
   * Every route payload broadcast during {@link bind}, in binding order.
   *
   * Retained so an adapter attaching *after* bootstrap can be caught up.
   * Broadcasting alone is not enough: a route published before the adapter
   * subscribed would simply be lost, and a late `connectTo()` — the normal
   * order, since adapters need the application handle — would come up empty.
   */
  private readonly routeLog: GlandRoute[] = [];

  constructor(
    private readonly explorer: Explorer,
    private readonly broker: TGlandBroker,
    private readonly registryBuilder: ChannelRegistryBuilder,
    logger?: Logger,
  ) {
    this.logger = logger?.child('Binder');
  }

  /**
   * Binds every discovered channel and route.
   *
   * Channels are bound first so a route handler can already reach them by the
   * time it runs.
   *
   * @throws if two channels declare the same public event name
   */
  public bind(): void {
    this.logger?.debug('Binding application components...');
    this.bindChannels();
    this.bindControllers();
    this.logger?.info('- Binding complete.');
  }

  /**
   * The frozen `publicEventName -> brokerEventName` index.
   *
   * Built once here and shared by reference with every request context, so a
   * request no longer copies the whole channel table.
   */
  public get channelRegistry(): ChannelRegistry {
    return this.frozenRegistry;
  }

  /**
   * Every route discovered so far, in binding order.
   *
   * {@link GlandBroker.connectTo} replays these to a newly attached adapter, so
   * an adapter that joins after bootstrap still receives the full route table.
   */
  public get routes(): readonly GlandRoute[] {
    return this.routeLog;
  }

  /**
   * Re-publishes every known route onto `broker`.
   *
   * Used when an adapter attaches after binding has already run.
   *
   * @param broker - the adapter's broker
   */
  public replayRoutes(broker: TGlandBroker): void {
    for (const route of this.routeLog) {
      broker.broadcast(GLAND_ROUTE_EVENT as never, route as never);
    }
    this.logger?.debug(`Replayed ${this.routeLog.length} route(s) to ${broker.id}`);
  }

  /** Subscribes every `@On()` handler to its broker event. */
  private bindChannels(): void {
    for (const channel of this.explorer.exploreChannels()) {
      const binding: ChannelBinding = this.registryBuilder.add(channel.namespace, channel.event, channel.token.name);
      const { instance, target } = channel;

      this.broker.on(binding.fullName as never, ((...args: unknown[]) => target.apply(instance, args)) as never);

      this.logger?.info(`Channel bound: "${binding.publicName}" -> ${channel.token.name}#${target.name}`);
    }

    this.frozenRegistry = this.registryBuilder.freeze();
  }

  /** Broadcasts every discovered route for adapters to register. */
  private bindControllers(): void {
    const registry = this.frozenRegistry;
    const brokerId = this.broker.id;

    for (const route of this.explorer.exploreControllers()) {
      const { method, route: handlerPath, controller } = route;
      const fullPath = combineRoutePath(controller.path, handlerPath);
      const { instance, target, methodName } = controller;
      const httpMethod = method.toUpperCase();

      const payload: GlandRoute = {
        path: handlerPath,
        fullPath,
        method: httpMethod,
        action: (ctx: any, ...args: unknown[]) => {
          this.logger?.debug(`[Broker] ${httpMethod} ${fullPath}`);
          // Publish the shared registry by reference. It is frozen and never
          // mutated after binding, so no per-request copy is needed.
          if (typeof ctx?.attachRegistry === 'function') {
            ctx.attachRegistry(brokerId, registry);
          }
          // `target` is the bare prototype method, so `this` must be restored
          // explicitly — a bare `target(ctx)` would run with `this === undefined`
          // and break any handler that touches instance state. Extra arguments
          // are forwarded so an adapter can pass route params alongside ctx.
          return target.apply(instance, [ctx, ...args]);
        },
      };

      this.routeLog.push(payload);
      this.broker.broadcast(GLAND_ROUTE_EVENT as never, payload as never);

      this.logger?.info(`Route bound: [${httpMethod}] ${fullPath} -> #${methodName}`);
    }
  }
}
