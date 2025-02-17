import { EventContext } from '../core';
import { EventBus } from '../core/event-bus';
import { EventPhase, EventType } from '@gland/common';
import { EventHook } from '../interface';
import { Event, Listener } from '../types';
import { CorrelationIdFactory } from '../core/correlation-id-factory';
export class ErrorHook implements EventHook {
  name = 'error';
  constructor(private context: EventContext, private correlationIdFactory: CorrelationIdFactory) {}
  async onError<E extends Event>(error: Error, event: E, listener: Listener) {
    const correlationId = this.correlationIdFactory.create();
    const errorEvent: Event<EventType.ERROR> = {
      type: EventType.ERROR,
      phase: EventPhase.MAIN,
      data: {
        originalEvent: event,
        listener: listener.name,
      },
      error: error,
      correlationId: correlationId,
    };

    this.context.get<EventBus>('ctx:bus')!.emit(errorEvent);
  }
}
