import { EventType } from '@gland/common';

declare const OpaqueCorrelationId: unique symbol;
export type CorrelationId = string & { [OpaqueCorrelationId]: true };
export type EventLiteral = (typeof EventType)[keyof typeof EventType];

type EventMap = {
  [K in EventLiteral]: K | `${K}` | `${EventLiteral}`;
};

export type EventIdentifier<T extends string = string> = `${EventMap[keyof EventMap]}` | T;

/**
 * Represents an event in Gland's event-driven system.
 * @template T - The event type (e.g., "server:start").
 * @template P - The event phase (e.g., "pre" or "main").
 * @template D - The payload data type.
 */
export type Event<T extends EventLiteral = EventLiteral, D = any> = {
  type: T;
  data: D;
  correlationId: CorrelationId;
};
export type Listener<R = any> = (event: Event) => R;
