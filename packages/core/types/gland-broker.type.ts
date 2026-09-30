import type { GlandEvents } from '@glandjs/common';
import type { Broker } from '@glandjs/events';

/**
 * The core application's event bus, typed with the events Gland itself
 * publishes: route broadcasts and channel handler events.
 */
export type TGlandBroker = Broker<GlandEvents>;
