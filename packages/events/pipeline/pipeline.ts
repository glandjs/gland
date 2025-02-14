import { PhaseManager } from './phase-manager';
import { ErrorStrategy } from './error-strategy';
import { Event } from '../types';
import { EventContext } from '../core';

export class EventPipeline {
  constructor(private phaseManager: PhaseManager, private errorStrategy: ErrorStrategy, private context: EventContext) {}

  async process<E extends Event>(event: E): Promise<void> {
    try {
      this.context.set('ctx:current_phase', event.phase);
      await this.phaseManager.transition(event);
    } catch (error) {
      await this.errorStrategy.handleError(error, event);
    }
  }
}
