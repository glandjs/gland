import { EventPhase, EventType } from '@gland/common';

declare const OpaqueCorrelationId: unique symbol;
export type CorrelationId = string & { [OpaqueCorrelationId]: true };
export type IEventPhase = (typeof EventPhase)[keyof typeof EventPhase];

export type IEventType = (typeof EventType)[keyof typeof EventType];

type QualifiedEventMap = {
  [K in IEventType]: K | `${K}:${IEventPhase}` | `${IEventType}`;
};

export type QualifiedEvent<T extends string = string> = `${QualifiedEventMap[keyof QualifiedEventMap]}` | `${T}:${IEventPhase}` | T;

/**
 * Represents an event in Gland's event-driven system.
 * @template T - The event type (e.g., "server:start").
 * @template P - The event phase (e.g., "pre" or "main").
 * @template D - The payload data type.
 */
export type Event<T extends IEventType = IEventType, D = any> = {
  type: T;

  phase: IEventPhase;

  data: D;

  error?: Error;

  correlationId: CorrelationId;

  timestamp?: number;
};
export type Listener<R = any> = (event: Event) => void | Promise<void> | R | Promise<R>;

export type EventFlow<T extends IEventType, D = any> = {
  [P in IEventPhase]: Event<T, D>;
};
export type EventStrategyType = 'queue' | 'broadcast' | 'immediate';
