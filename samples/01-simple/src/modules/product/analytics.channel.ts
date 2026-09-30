import { Channel, On } from '@glandjs/common';
import type { OnChannelInit } from '@glandjs/core';

/**
 * A channel with no namespace, addressed as `analytics:viewed`.
 *
 * The namespace is optional: `@On('viewed')` under `@Channel('analytics')`
 * becomes `analytics:viewed`.
 */
@Channel('analytics')
export class AnalyticsChannel implements OnChannelInit {
  onChannelInit(): void {
    console.log('[Analytics] Channel initialized');
  }

  /** Fire-and-forget: reached with `ctx.emit()`, result discarded. */
  @On('viewed')
  trackView(payload: { id: string }): void {
    console.log(`[Analytics] Product ${payload.id} viewed`);
  }
}
