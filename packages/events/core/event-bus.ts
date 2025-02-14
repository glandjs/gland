import { EVENTS_METADATA } from '../constant';
import { EventHook, EventStrategy } from '../interface';
import { ErrorStrategy, EventPipeline, PhaseManager } from '../pipeline';
import { Event } from '../types';
import { EventContext } from './event-context';
import { EventRegistry } from './event-registry';
import 'reflect-metadata';
export class EventBus {
  private hooks: EventHook[] = [];
  private pipeline: EventPipeline;

  constructor(private registry: EventRegistry, private strategy: EventStrategy, private context: EventContext) {
    Reflect.defineMetadata(EVENTS_METADATA.EVENT_BUS, this, this);
    this.pipeline = this.createPipeline();
  }

  addHook(hook: EventHook): void {
    this.hooks.push(hook);
  }

  private createPipeline(): EventPipeline {
    const phaseManager = new PhaseManager(this.registry, this.strategy);
    const errorStrategy = new ErrorStrategy(this.context);
    return new EventPipeline(phaseManager, errorStrategy, this.context);
  }
  async emit<E extends Event>(event: E): Promise<void> {
    this.context.set('ctx:bus', this, true);
    this.context.set('ctx:registry', this.registry, true);
    this.context.set('ctx:processed', false);
    this.context.set('ctx:current_phase', event.phase);

    try {
      await this.pipeline.process(event);
    } catch (error) {
      for (const listener of this.registry.getListeners(event.type)) {
        for (const hook of this.hooks) {
          await hook.onError?.(error, event, listener);
        }
      }
    } finally {
      // Cleanup
      this.context.set('ctx:processed', true);
      this.cleanupOnceListeners(event);
    }
  }
  private cleanupOnceListeners(event: Event<any>) {
    this.registry.getListeners(event.type).forEach((l) => this.registry.unregister(event.type, l));
  }
}
