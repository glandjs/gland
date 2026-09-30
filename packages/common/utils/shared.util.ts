import { GLAND_CHANNEL_EVENT } from '../constant';

/**
 * A channel handler resolved by the application binder.
 *
 * @see buildChannelRegistry
 */
export interface ChannelBinding {
  /** Namespace declared with `@Channel('db')`, or `''` when none was given. */
  readonly namespace: string;
  /** Event name declared with `@On('product:create')`. */
  readonly event: string;
  /**
   * Name applications use to reach this handler, e.g. `db:product:create`.
   * This is the key applications see and must use.
   */
  readonly publicName: string;
  /**
   * Fully-qualified broker event actually bound by the binder, e.g.
   * `gland:define:channel:db:product:create`. Internal plumbing — applications
   * should use {@link publicName}.
   */
  readonly fullName: string;
  /** Class name of the channel that declares the handler. */
  readonly owner: string;
}

/**
 * Immutable `publicName -> fullName` index handed to every request context.
 *
 * Replacing the previous array-scan lookup with a plain record makes channel
 * resolution a single O(1) property read and removes the ambiguity of
 * "first match wins".
 */
export type ChannelRegistry = Readonly<Record<string, string>>;

/**
 * Builds the fully-qualified broker event for a channel handler.
 *
 * A channel without a namespace is still addressable: the namespace segment is
 * simply omitted rather than being stringified into the literal `"undefined"`.
 *
 * @param namespace - namespace from `@Channel(...)`, may be empty
 * @param event - event name from `@On(...)`
 */
export function buildChannelEventName(namespace: string | undefined, event: string): string {
  return namespace ? `${GLAND_CHANNEL_EVENT}:${namespace}:${event}` : `${GLAND_CHANNEL_EVENT}:${event}`;
}

/**
 * Builds the name an application uses to address a channel handler.
 *
 * `buildPublicEventName('db', 'product:create')` -> `'db:product:create'`
 * `buildPublicEventName('', 'ping')`             -> `'ping'`
 *
 * @param namespace - namespace from `@Channel(...)`, may be empty
 * @param event - event name from `@On(...)`
 */
export function buildPublicEventName(namespace: string | undefined, event: string): string {
  return namespace ? `${namespace}:${event}` : event;
}

/**
 * Accumulates channel bindings and rejects duplicate public names.
 *
 * Two channels claiming the same `namespace:event` used to be resolved
 * silently — whichever happened to be discovered first won, and the other was
 * unreachable. Failing loudly at bind time turns a confusing runtime "my
 * handler is never called" bug into an immediate, readable startup error.
 */
export class ChannelRegistryBuilder {
  private readonly bindings = new Map<string, ChannelBinding>();

  /**
   * Registers one channel handler.
   *
   * @throws if another channel already claimed {@link ChannelBinding.publicName}
   */
  public add(namespace: string | undefined, event: string, owner: string): ChannelBinding {
    const publicName = buildPublicEventName(namespace, event);

    const existing = this.bindings.get(publicName);
    if (existing) {
      throw new Error(
        `Duplicate channel event "${publicName}".\n` +
          `  already declared by: ${existing.owner} (${existing.fullName})\n` +
          `  redeclared by:        ${owner}\n` +
          'Every channel event must be globally unique. Rename the namespace or the @On() event.',
      );
    }

    const binding: ChannelBinding = {
      namespace: namespace ?? '',
      event,
      publicName,
      fullName: buildChannelEventName(namespace, event),
      owner,
    };
    this.bindings.set(publicName, binding);
    return binding;
  }

  /** All bindings in registration order. */
  public all(): ChannelBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * Freezes the accumulated bindings into the lookup record shared by every
   * request context.
   *
   * Built once during bootstrap; safe to hand to concurrent requests because
   * it is deeply frozen and never mutated afterwards.
   */
  public freeze(): ChannelRegistry {
    const registry: Record<string, string> = Object.create(null);
    for (const binding of this.bindings.values()) {
      registry[binding.publicName] = binding.fullName;
    }
    return Object.freeze(registry);
  }
}

/**
 * Normalises a filesystem-ish path: guarantees a single leading slash, no
 * trailing slash, and no repeated slashes.
 *
 * Both branches previously behaved differently — the absolute-path branch
 * collapsed duplicate slashes while the relative branch did not, so
 * `'api//v1'` normalised to `'/api//v1'` but `'/api//v1'` normalised to
 * `'/api/v1'`.
 *
 * @example
 * normalizePath()             // '/'
 * normalizePath('products')   // '/products'
 * normalizePath('/products/') // '/products'
 * normalizePath('api//v1//')  // '/api/v1'
 */
export function normalizePath(path?: string): string {
  if (!path) return '/';
  return `/${path}`.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';
}

/**
 * Joins a controller-level path with a handler-level path into one route.
 *
 * @example
 * combineRoutePath('/products', ':id') // '/products/:id'
 * combineRoutePath('products', '/')    // '/products'
 * combineRoutePath('', '/')            // '/'
 */
export function combineRoutePath(basePath: string | undefined, handlerPath: string | undefined): string {
  const base = normalizePath(basePath);
  const handler = normalizePath(handlerPath);
  if (base === '/') return handler;
  if (handler === '/') return base;
  return `${base}${handler}`;
}

/**
 * Type guard for a dynamic module definition.
 *
 * A dynamic module is a plain object carrying a `module` class plus metadata,
 * as opposed to a bare module class.
 */
export function isDynamicModule(module: unknown): module is { module: unknown } & Record<string, unknown> {
  return typeof module === 'object' && module !== null && 'module' in module;
}
