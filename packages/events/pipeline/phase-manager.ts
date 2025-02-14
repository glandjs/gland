import { EventRegistry } from '../core/event-registry';
import { EventStrategy } from '../interface';
import { Event } from '../types';

export class PhaseManager {
  constructor(private registry: EventRegistry, private strategy: EventStrategy) {}

  async executePhase(event: Event<any>): Promise<void> {
    const listeners = this.registry.getListeners(event.type);

    try {
      const start = event.lifecycle?.startedAt;
      const end = new Date();
      event.lifecycle!.finishedAt = end;
      event.lifecycle!.durationMs = end.getTime() - (start?.getTime() || end.getTime());
      event.isSuccess = true;
      event.isFailure = false;
      await this.strategy.execute(event, listeners);
    } catch (error) {
      event.isFailure = true;
      event.isSuccess = false;
      throw error;
    }
  }

  async transition<E extends Event>(event: E): Promise<void> {
    await this.executePhase(event);
  }
}
