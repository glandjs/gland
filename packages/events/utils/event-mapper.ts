import { EventPhase } from '../enums';
import { QualifiedEvent, IEventType, IEventPhase, Event } from '../types';

/**
 * Utility class for event transformation and type mapping
 */
export class EventMapper {
  static parseQualifiedType(qualified: QualifiedEvent): {
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
    const { phase, type } = this.parseQualifiedType(qualified);
    const event = {
      phase,
      type,
    };
    return this.createQualifiedEvent(event as any);
  }
}
