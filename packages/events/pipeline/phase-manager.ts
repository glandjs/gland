import { EventRegistry } from '../core/event-registry';
import { EventStrategy } from '../interface';
import { Event } from '../types';

export class PhaseManager {
  constructor(private registry: EventRegistry, private strategy: EventStrategy) {}

  async executePhase(event: Event<any>): Promise<void> {
    const listeners = this.registry.getListeners(event.type);

    try {
      await this.strategy.execute(event, listeners);
    } catch (error) {
      throw error;
    }
  }

  async transition<E extends Event>(event: E): Promise<void> {
    await this.executePhase(event);
  }
}
