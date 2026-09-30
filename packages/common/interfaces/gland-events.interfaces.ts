import type { Dictionary } from '@medishn/toolkit';
import type { GLAND_CHANNEL_EVENT, GLAND_ROUTE_EVENT } from '../constant';

/**
 * Payload of a {@link GLAND_ROUTE_EVENT} broadcast.
 *
 * The binder emits one of these per discovered route. Protocol adapters
 * subscribe and register the route on themselves — this is the entire
 * extension seam of the framework.
 *
 * @typeParam TContext - the adapter's request context type
 */
export interface GlandRoute<TContext = any> {
  /**
   * The handler's own path, relative to the controller prefix
   * (e.g. `':id'`). Exposed for adapters that need to mount sub-routers.
   */
  readonly path: string;

  /**
   * The fully-qualified path, controller prefix included
   * (e.g. `'/products/:id'`). This is what adapters should register.
   */
  readonly fullPath: string;

  /** Upper-case HTTP method, e.g. `'GET'`. */
  readonly method: string;

  /**
   * Invoked by the adapter when a request matches.
   *
   * The binder has already attached `brokerId` and the channel registry to
   * `ctx.state`, so `ctx.emit()`/`ctx.call()` work inside the handler. Adapters
   * may pass extra arguments — route params, a parsed body, and so on — and
   * they are forwarded to the handler after the context.
   */
  readonly action: (ctx: TContext, ...args: unknown[]) => unknown;
}

/**
 * Payload of a channel event. Handlers receive whatever the caller passes to
 * `ctx.emit()`/`ctx.call()`; the channel layer itself is payload-agnostic.
 */
export type GlandChannelPayload = unknown;

/**
 * The event map of the broker owned by `@glandjs/core`.
 *
 * @see GLAND_ROUTE_EVENT
 * @see GLAND_CHANNEL_EVENT
 */
export interface GlandEvents {
  /** Route registration broadcast. @see GlandRoute */
  [GLAND_ROUTE_EVENT]: GlandRoute;
  /** Per-handler channel events, e.g. `gland:define:channel:db:product:create`. */
  [key: `${typeof GLAND_CHANNEL_EVENT}:${string}`]: GlandChannelPayload;
  /** Escape hatch for protocol adapters that need their own broker events. */
  [key: string]: unknown;
}

/**
 * State the application binder attaches to every request context.
 *
 * Stored under the reserved `channel` key, which applications should treat as
 * read-only — it is a frozen, shared object, not a per-request copy.
 */
export interface GlandContextState extends Dictionary<unknown> {
  /** Id of the core broker this request is being served by. */
  readonly brokerId?: string;
  /** Frozen `publicEventName -> brokerEventName` index. @see ChannelRegistry */
  readonly channel?: Readonly<Record<string, string>>;
}
