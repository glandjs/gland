import { EventContext } from '../core';
import { EventBus } from '../core/event-bus';
import { EventPhase, EventType } from '@gland/common';
import { EventHook } from '../interface';
import { Event, Listener } from '../types';
export class ErrorHook implements EventHook {
  name = 'error';
  constructor(private context: EventContext) {}
  async onError<E extends Event>(error: Error, event: E, listener: Listener) {
    const errorEvent: Event<EventType.ERROR> = {
      type: EventType.ERROR,
      phase: EventPhase.MAIN,
      data: {
        originalEvent: event,
        listener: listener.name,
      },
      isFailure: true,
      isSuccess: false,
      lifecycle: {},
      error: error,
    };

    this.context.get<EventBus>('ctx:bus')!.emit(errorEvent);
  }
}
