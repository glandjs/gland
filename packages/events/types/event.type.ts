import { EventPhase, EventType } from '../enums';
export type IEventPhase = (typeof EventPhase)[keyof typeof EventPhase];

export type IEventType = (typeof EventType)[keyof typeof EventType];

export type QualifiedEvent = `${IEventType}` | `${IEventType}:${IEventPhase}`;
/**
 * Represents an event in Gland's event-driven system.
 * @template T - The event type (e.g., "server:start").
 * @template P - The event phase (e.g., "pre" or "main").
 * @template D - The payload data type.
 */
export type Event<T extends IEventType = IEventType, P extends IEventPhase = IEventPhase, D = any> = {
  /** The event type (e.g., "server:start"). */
  type: T;

  /** The event phase (e.g., "pre" or "main"). */
  phase: P;

  /** The payload data associated with the event. */
  data: D;

  /** Event lifecycle timestamps */
  lifecycle?: {
    /** When event processing started */
    startedAt?: Date;
    /** When event processing finished */
    finishedAt?: Date;
    /** Total processing duration */
    durationMs?: number;
  };
  /** The error object if the event failed processing. */
  error?: Error;

  /** A flag indicating whether the event is a success event (e.g., for success notifications). */
  isSuccess?: boolean;

  /** A flag indicating whether the event is a failure event (e.g., for failure notifications). */
  isFailure?: boolean;
};
export type Listener<T = Event> = (event: T) => void | Promise<void>;

export type EventFlow<T extends IEventType, D = any> = {
  [P in IEventPhase]: Event<T, P, D>;
};
export type EventStrategyType = 'queue' | 'broadcast' | 'immediate';
