import { EventContext } from '../core/event-context';
import { EventPhase } from '../enums';
import { Event } from '../types';

export class ErrorStrategy {
  constructor(private context: EventContext) {}

  async handleError(error: Error, event: Event): Promise<void> {
    this.context.set('ctx:last_error', error);
    this.context.set('ctx:error_phase', event.phase);
    event.phase = EventPhase.ERROR;
    event.phase = EventPhase.FALLBACK;
    event.error = error;
  }
}
