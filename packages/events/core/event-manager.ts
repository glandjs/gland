import { EVENTS_METADATA } from '../constant';
import { ErrorHook } from '../hooks';
import { EventChannel } from '../interface';
import { BroadcastStrategy, ImmediateStrategy, QueueStrategy } from '../strategies';
import { Event, EventStrategyType, Listener, QualifiedEvent } from '../types';
import { EventMapper } from '../utils/event-mapper';
import { CorrelationIdFactory } from './correlation-id-factory';
import { EventBus } from './event-bus';
import { ContextFactory, EventContext } from './event-context';
import { EventRegistry } from './event-registry';
import 'reflect-metadata';
import { EventQueue } from './event.queue';
import { EventType } from '@gland/common';

export class EventManager {
  private bus: EventBus;
  private context: EventContext;
  private registry: EventRegistry;
  private queues = new Map<string, EventQueue>();
  private correlationIdFactory: CorrelationIdFactory;
  private channels = new Map<string, EventChannel<any, any>>();
  private readonly MAX_SIZE: number = 1000;
  constructor(strategy?: EventStrategyType) {
    this.correlationIdFactory = new CorrelationIdFactory();

    this.registry = EventRegistry.getInstance();
    this.context = new ContextFactory().create();
    this.bus = new EventBus(this.registry, this.createStrategy(strategy), this.context);
    this.bus.addHook(new ErrorHook(this.context, this.correlationIdFactory));
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

  async request<T extends string, D = any, R = any>(qualified: QualifiedEvent<T>, data?: D): Promise<R> {
    const event = EventMapper.createEvent(qualified, data);
    const listeners = this.registry.getListeners(event.type);

    const results = await Promise.all(listeners.map(async (listener) => listener(event)));

    const mergedResults = results.reduce((acc, result) => {
      return { ...acc, ...result };
    }, {});
    return mergedResults;
  }

  channel<T extends string, D = any, R = any>(type: QualifiedEvent<T>): EventChannel<D, R> {
    if (!this.channels.has(type)) {
      this.channels.set(type, this.createChannel(type));
    }
    return this.channels.get(type)!;
  }

  private createChannel<T, R>(type: QualifiedEvent): EventChannel<T, R> {
    return {
      emit: (data) => this.emit(type, data),
      request: (data) => this.request(type, data),
      respond: (handler: (data: T) => Promise<R> | R) => {
        return this.on(type, async (event) => {
          try {
            return await handler(event.data);
          } catch (error) {
            this.emit(`${event.type}:error`, {
              correlationId: event.correlationId,
              error,
            });
          }
        });
      },
    };
  }

  async emit<T extends string, D>(qualified: QualifiedEvent<T>, data?: D): Promise<void> {
    const event = EventMapper.createEvent(qualified, data);

    if (this.registry.hasListeners(event.type)) {
      await this.bus.emit(event);
    } else {
      if (this.registry.hasEverHadListeners(event.type)) {
        console.warn(`[EventManager] No active listeners for "${event.type}", but previous listeners existed. Not queuing.`);
        return;
      }
      console.warn(`[EventManager] No listeners for "${event.type}", queueing event.`);
      this.queueEvent(event);
    }
  }

  private queueEvent<T extends EventType, D>(event: Event<T, D>): void {
    const queue = this.getOrCreateQueue(event.type);
    queue.enqueue(event);
  }
  private getOrCreateQueue<T extends EventType>(type: T): EventQueue<T> {
    if (!this.queues.has(type)) {
      this.queues.set(type, new EventQueue<T>(this.MAX_SIZE));
    }
    return this.queues.get(type) as EventQueue<T>;
  }

  on<T extends string, R>(qualified: QualifiedEvent<T>, listener: Listener<R>): () => void {
    const { type } = EventMapper.parseQualifiedEvent(qualified);
    // Mark that this event type has had listeners
    this.registry.markHasListeners(type);

    this.registry.register(type, listener);

    const unsubscribe = () => {
      this.off(type, listener);
      this.cleanupQueue(type);
    };

    const queue = this.queues.get(type);
    if (queue) {
      console.log(`[EventManager] Processing queued events for "${type}"`);
      queue.process(async (event) => {
        await this.bus.emit(event);
      });
      this.queues.delete(type);
    }
    return unsubscribe;
  }
  off<T extends string, R>(qualified: QualifiedEvent<T>, listener: Listener<R>): void {
    const { type } = EventMapper.parseQualifiedEvent(qualified);
    this.registry.unregister(type, listener);
  }

  private cleanupQueue<T extends EventType>(type: T): void {
    if (!this.registry.hasListeners(type)) {
      const queue = this.queues.get(type);
      if (queue) {
        console.log(`[EventManager] Cleaning up queue for "${type}"`);
        queue.clear();
        this.queues.delete(type);
      }
    }
  }
}
