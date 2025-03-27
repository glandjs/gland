import { Callback, Noop } from '@medishn/toolkit';
import { CryptoUUID, EventChannel, EventType, type EventOptions } from '@gland/common';
import { EventRouter } from './container';
import { ChannelProxy } from './channel-proxy';
export type RequestStrategy = 'first' | 'last' | 'all';

export class Broker {
  private readonly _connections = new Map<string, Broker>();

  private readonly router: EventRouter;
  private readonly _channels = new Map<string, EventChannel>();

  constructor(private _id: string = CryptoUUID.generate()) {
    this.router = new EventRouter();
  }
  public get id(): string {
    return this._id;
  }

  public request<R>(type: EventType, data: any, strategy?: 'first' | 'last'): R | undefined;
  public request<R>(type: EventType, data: any, strategy?: 'all'): R[];
  public request<R>(type: EventType, data: any, strategy: RequestStrategy = 'first'): R | R[] | undefined {
    const listeners = this.getListeners<any>(type);
    if (!listeners || listeners.length === 0) {
      return strategy === 'all' ? [] : undefined;
    }

    const results: R[] = [];

    for (const listener of listeners) {
      let result: R | undefined;
      result = listener(data)!;

      if (result !== undefined) {
        results.push(result);
      }
    }

    if (strategy === 'first') {
      return results[0];
    } else if (strategy === 'last') {
      return results[results.length - 1];
    }

    return results;
  }

  public respond<T, R>(type: EventType, listener: (data: T) => R): Noop {
    return this.on(type, listener);
  }

  public channel(type: EventType): EventChannel {
    if (!this._channels.has(type)) {
      this._channels.set(type, new ChannelProxy(this, type));
    }
    return this._channels.get(type)!;
  }

  public emit<D>(event: EventType, data: D, options?: EventOptions): void {
    this.router.emit(event, data, options);
  }

  public on<T extends any[] = any>(event: EventType, listener: Callback<T>, options?: EventOptions): Noop {
    this.router.on(event, listener, options);
    const unsubscribe = () => {
      this.router.off(event, listener);
    };
    return unsubscribe;
  }
  public off(event: string, listener: Callback): void {
    this.router.off(event, listener);
  }

  public pipe(sourceEvent: EventType, targetEvent: EventType): Noop {
    return this.on(sourceEvent, (data) => {
      this.emit(targetEvent, data);
    });
  }
  public forward(broker: Broker, event: EventType): Noop {
    return this.on(event, (data) => {
      broker.emit(event, data);
    });
  }

  public once<T extends any[] = any>(event: EventType, listener: Callback<T>): void {
    this.router.once(event, listener);
  }

  public broadcast<D>(event: EventType, data?: D): void {
    const events = this.router.getEventsByPrefix(event);
    events.forEach((e) => this.emit(e, data));
  }

  public getListeners<T>(event: string): T[] {
    return this.router.getListeners(event) as T[];
  }

  public connectTo(broker: Broker): Noop {
    if (broker.id === this.id) {
      throw new Error('Cannot connect a broker to itself');
    }

    this._connections.set(broker.id, broker);

    if (!broker._connections.has(this.id)) {
      broker.connectTo(this);
    }

    return () => {
      this.disconnect(broker.id);
    };
  }
  public disconnect(brokerId: string): boolean {
    const broker = this._connections.get(brokerId);
    if (!broker) return false;

    this._connections.delete(brokerId);

    if (broker._connections.has(this.id)) {
      broker.disconnect(this.id);
    }

    return true;
  }
  public emitTo<D>(brokerId: string, event: EventType, data: D, options?: EventOptions): boolean {
    const broker = this._connections.get(brokerId);
    if (!broker) return false;

    broker.emit(event, data, options);
    return true;
  }

  public broadcastTo<D>(event: EventType, data: D): number {
    let count = 0;
    this._connections.forEach((connection) => {
      connection.emit(event, data);
      count++;
    });
    return count;
  }

  public requestTo<R>(brokerId: string, ...args: Parameters<Broker['request']>) {
    const broker = this._connections.get(brokerId);
    if (!broker) return undefined;

    return broker.request<R>(...args);
  }

  public pipeTo(brokerId: string, sourceEvent: EventType, targetEvent: EventType): Noop {
    const broker = this._connections.get(brokerId);
    if (!broker) {
      throw new Error(`Broker ${brokerId} not found`);
    }

    const off = this.on(sourceEvent, (data) => {
      broker.emit(targetEvent, data);
    });

    return () => {
      off();
    };
  }
  public connectAll(brokers: Broker[]): Noop {
    const disconnects: Noop[] = [];
    for (const broker of brokers) {
      disconnects.push(this.connectTo(broker));
    }

    return () => {
      disconnects.forEach((disconnect) => disconnect());
    };
  }

  public static createRelations(brokers: Broker[]): void {
    for (let i = 0; i < brokers.length; i++) {
      for (let j = i + 1; j < brokers.length; j++) {
        brokers[i].connectTo(brokers[j]);
      }
    }
  }

  public forwardTo(event: EventType): Noop {
    return this.on(event, (data) => {
      this.broadcastTo(event, data);
    });
  }

  public relayTo<D>(event: EventType, data: D, sourceId?: string): number {
    let count = 0;
    this._connections.forEach((broker, brokerId) => {
      if (brokerId !== sourceId) {
        broker.emit(event, data);
        count++;
      }
    });
    return count;
  }
}
