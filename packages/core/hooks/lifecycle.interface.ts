/**
 * Lifecycle hooks a provider may implement.
 *
 * All are optional. Gland detects them structurally, so a provider does not
 * need to declare that it implements an interface:
 *
 * ```ts
 * @Module({ controllers: [ProductController] })
 * export class ProductModule {
 *   onModuleInit()    { /* ... *\/ }
 *   onModuleDestroy() { /* ... *\/ }
 * }
 * ```
 *
 * Phases run in a fixed order, and providers within a phase run concurrently:
 *
 * | # | Phase             | Hooks invoked                            |
 * |---|-------------------|------------------------------------------|
 * | 1 | module init       | {@link OnModuleInit.onModuleInit}        |
 * | 2 | binding           | (routes and channels are bound)           |
 * | 3 | channel init      | {@link OnChannelInit.onChannelInit}       |
 * | 4 | bootstrap         | {@link OnAppBootstrap.onAppBootstrap}     |
 * | 5 | shutdown          | {@link OnAppShutdown.onAppShutdown}, then {@link OnModuleDestroy.onModuleDestroy} |
 *
 * A hook that throws is logged and skipped; it never aborts the phase.
 *
 * @packageDocumentation
 */

/** Called after the module graph is registered and providers are constructed. */
export interface OnModuleInit {
  onModuleInit(): Promise<void> | void;
}

/**
 * Called during shutdown, after {@link OnAppShutdown}, for every provider
 * releasing resources.
 */
export interface OnModuleDestroy {
  onModuleDestroy(): Promise<void> | void;
}

/** Called once, after routes and channels are bound. */
export interface OnAppBootstrap {
  onAppBootstrap(): Promise<void> | void;
}

/**
 * Called at the start of shutdown, before {@link OnModuleDestroy}.
 *
 * @param signal - the signal that triggered shutdown, when there was one
 */
export interface OnAppShutdown {
  onAppShutdown(signal?: string): Promise<void> | void;
}

/**
 * Called after binding, for providers that need to know their channels are
 * reachable.
 */
export interface OnChannelInit {
  onChannelInit(): Promise<void> | void;
}
