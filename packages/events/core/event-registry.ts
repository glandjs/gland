import { IEventType, Listener } from '../types';

export class EventRegistry {
  private static instance: EventRegistry;
  private listeners = new Map<IEventType, Listener<any>[]>();
  private hasHadListeners = new Set<string>();

  private constructor() {}

  static getInstance(): EventRegistry {
    if (!EventRegistry.instance) {
      EventRegistry.instance = new EventRegistry();
    }
    return EventRegistry.instance;
  }

  register(type: IEventType, listener: Listener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);

    this.listeners.set(type, listeners);
    this.hasHadListeners.add(type);
  }

  unregister(type: IEventType, listener: Listener): void {
    const listeners = this.listeners.get(type)?.filter((l) => l !== listener);
    if (listeners) this.listeners.set(type, listeners);
  }

  getListeners(type: IEventType): Listener[] {
    return this.listeners.get(type) ?? [];
  }

  hasListeners(event: IEventType): boolean {
    return !!this.listeners.get(event)?.length;
  }

  hasEverHadListeners(type: string): boolean {
    return this.hasHadListeners.has(type);
  }

  markHasListeners(type: string): void {
    this.hasHadListeners.add(type);
  }
}
