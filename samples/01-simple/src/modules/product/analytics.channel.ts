import { Channel, On } from '@glandjs/common';
import type { OnChannelInit } from '@glandjs/core';

/**
 * A channel that only records what happened.
 *
 * Reached with `ctx.emit('analytics:viewed', …)`, so its return value is
 * discarded — the caller has already been told what it needed. A channel that
 * nobody waits on is a side effect, and this is what that looks like.
 */
@Channel('analytics')
export class AnalyticsChannel implements OnChannelInit {
  onChannelInit(): void {
    console.log('[Analytics] onChannelInit');
  }

  @On('viewed')
  trackView(payload: { id: string }): void {
    console.log(`[Analytics] Product ${payload.id} viewed`);
  }
}
