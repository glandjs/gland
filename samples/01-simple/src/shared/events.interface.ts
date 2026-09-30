import type { IOEvent } from '@glandjs/events';
import type { Product } from './product';

/**
 * The event map for this sample application.
 *
 * Typing the context with it makes `ctx.call()` and `ctx.emit()` check both the
 * payload and the return value:
 *
 * ```ts
 * const product = await ctx.call('db:product:find', id);  // Product | null
 * ctx.call('db:product:find', { wrong: true });           // compile error
 * ```
 */
export interface EventTypes {
  // ---- db: events ---------------------------------------------------------
  'db:product:create': IOEvent<Omit<Product, 'id'>, Product>;
  'db:product:find': IOEvent<string, Product | null>;
  'db:product:all': IOEvent<Record<string, never>, Product[]>;

  // ---- analytics: events --------------------------------------------------
  'analytics:viewed': IOEvent<{ id: string }, void>;
}
