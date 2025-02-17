import { EventPhase } from '@gland/common';
import { QualifiedEvent, IEventType, IEventPhase, Event } from '../types';
import { CorrelationIdFactory } from '../core/correlation-id-factory';

/**
 * Utility class for event transformation and type mapping
 */
export class EventMapper {
  static parseQualifiedEvent(qualified: QualifiedEvent): {
    type: IEventType;
    phase: IEventPhase;
  } {
    const parts = qualified.split(':');
    const possiblePhase = parts[parts.length - 1];
    if (Object.values(EventPhase).includes(possiblePhase as EventPhase)) {
      return {
        type: parts.slice(0, -1).join(':') as IEventType,
        phase: possiblePhase as IEventPhase,
      };
    }
    return {
      type: qualified as IEventType,
      phase: EventPhase.MAIN,
    };
  }
  static createQualifiedEvent<E extends Event>(event: E): QualifiedEvent {
    return `${event.type}:${event.phase}`;
  }

  static registryQualified(qualified: QualifiedEvent): QualifiedEvent {
    const event = EventMapper.createEvent(qualified, {});
    return this.createQualifiedEvent(event);
  }
  static createEvent<T extends string, D>(qualified: QualifiedEvent<T>, data?: D): Event {
    const correlationIdFactory = new CorrelationIdFactory();
    const correlationId = correlationIdFactory.create();
    const { phase, type } = EventMapper.parseQualifiedEvent(qualified);
    return {
      correlationId,
      data,
      type,
      phase,
      timestamp: Date.now(),
    };
  }
}
