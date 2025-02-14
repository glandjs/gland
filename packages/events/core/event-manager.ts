import { EVENTS_METADATA } from '../constant';
import { ErrorHook } from '../hooks';
import { BroadcastStrategy, ImmediateStrategy, QueueStrategy } from '../strategies';
import { Event, EventStrategyType, Listener, QualifiedEvent } from '../types';
import { EventMapper } from '../utils/event-mapper';
import { EventBus } from './event-bus';
import { ContextFactory, EventContext } from './event-context';
import { EventRegistry } from './event-registry';
import 'reflect-metadata';

export class EventManager {
  private bus: EventBus;
  private context: EventContext;
  private eventRegistry: EventRegistry;
  constructor(strategy?: EventStrategyType) {
    this.eventRegistry = EventRegistry.getInstance();
    this.context = new ContextFactory().create();
    this.bus = new EventBus(this.eventRegistry, this.createStrategy(strategy), this.context);
    this.bus.addHook(new ErrorHook(this.context));
    Reflect.defineMetadata(EVENTS_METADATA.EVENT_MANAGER, this, EventManager);
    Reflect.defineMetadata(EVENTS_METADATA.CONTEXT, this, EventContext);
  }
  private createStrategy(strategy?: EventStrategyType) {
    switch (strategy) {
      case 'broadcast':
        return new BroadcastStrategy();
      case 'queue':
        return new QueueStrategy();
      case 'immediate':
      default:
        return new ImmediateStrategy();
    }
  }
  async publish<T extends string, D>(qualified: QualifiedEvent<T>, data: D): Promise<void> {
    const { phase, type } = EventMapper.parseQualifiedType(qualified);

    const event: Event<typeof type, typeof phase, D> = {
      type,
      phase,
      data,
      lifecycle: {
        startedAt: new Date(),
      },
    };
    await this.bus.emit(event);
  }

  subscribe<T extends string>(qualified: QualifiedEvent<T>, listener: Listener): () => void {
    const { phase, type } = EventMapper.parseQualifiedType(qualified);
    this.eventRegistry.register(type, listener);

    return () => this.eventRegistry.unregister(type, listener);
  }
  unsubscribe<T extends string, D>(qualified: QualifiedEvent<T>, listener: Listener): void {
    const { phase, type } = EventMapper.parseQualifiedType(qualified);
    this.eventRegistry.unregister(type, listener);
  }

  batchSubscribe<T extends string, D>(listeners: { qualified: QualifiedEvent<T>; listener: Listener }[]): (() => void)[] {
    return listeners.map(({ qualified, listener }) => this.subscribe(qualified, listener));
  }
  batchUnsubscribe<T extends string, D>(listeners: { qualified: QualifiedEvent<T>; listener: Listener }[]): void {
    listeners.forEach(({ qualified, listener }) => this.unsubscribe(qualified, listener));
  }
}
