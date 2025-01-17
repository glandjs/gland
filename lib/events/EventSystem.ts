import { CoreEventType } from '../common/enums';
import { LifecycleEvents } from '../common/interfaces';
import { EventHandler, EventListener } from '../common/types';

export class EventSystem {
  private events: Partial<Record<CoreEventType, EventListener<any>[]>> = {};
  /**
   * Register a listener for a route event with a specific route.
   *
   * @param event - The `route` event type (must be `CoreEventType.Route`).
   * @param route - The route path to attach the listener to.
   * @param handler - The event handler for the route.
   * @example
   * app.on('route', 'users/:id', (ctx) => {
   *   console.log(`User route triggered with ID: ${ctx.params.id}`);
   * });
   */
  on(event: CoreEventType.Route, route: string, handler: EventHandler<CoreEventType.Route>): void;

  /**
   * Register a listener for a generic event (not route-based).
   *
   * @param event - The event type (any of `CoreEventType`).
   * @param handler - The event handler.
   * @example
   * app.on('start', (ctx) => {
   *   console.log('Server started');
   * });
   */
  on<T extends CoreEventType>(event: T, handler: EventHandler<T>): void;

  /**
   * Internal handler for registering event listeners.
   */
  on(event: CoreEventType, ...args: any[]): void {
    const handler = args.pop();
    if (!this.events[event]) {
      this.events[event] = [];
    }
    if (event === CoreEventType.Route && args.length === 1) {
      const route = args[0];
      this.events[event]!.push({ route, handler });
    } else {
      this.events[event]!.push({ handler });
    }
  }

  /**
   * Register a one-time listener for a route event with a specific route.
   *
   * @param event - The `route` event type (must be `CoreEventType.Route`).
   * @param route - The route path to attach the listener to.
   * @param handler - The event handler for the route.
   * @example
   * app.once('route', 'users/:id', (ctx) => {
   *   console.log('User route triggered once with ID:', ctx.params.id);
   * });
   */
  once(event: CoreEventType.Route, route: string, handler: EventHandler<CoreEventType.Route>): void;

  /**
   * Register a one-time listener for a generic event (not route-based).
   *
   * @param event - The event type (any of `CoreEventType`).
   * @param handler - The event handler.
   * @example
   * app.once('start', (ctx) => {
   *   console.log('Server started once');
   * });
   */
  once<T extends CoreEventType>(event: T, handler: EventHandler<T>): void;

  once(event: CoreEventType, ...args: any[]): void {
    const handler = args.pop();
    const route = event === CoreEventType.Route ? args[0] : undefined;

    const onceHandler = async (...onceArgs: any[]) => {
      this.off(event, onceHandler, route);
      return handler(...onceArgs);
    };

    if (route) {
      this.on(event as CoreEventType.Route, route, onceHandler);
    } else {
      this.on(event, onceHandler);
    }
  }

  /**
   * Remove a specific listener for an event.
   *
   * @param event - The event type (e.g., `CoreEventType.Route`, `CoreEventType.Start`).
   * @param handler - The event handler to remove.
   * @param route - Optional route for `route` events.
   * @example
   * app.off('route', 'users/:id', (ctx) => { console.log('Removing listener for user route'); });
   * app.off('start', (ctx) => { console.log('Removing start event listener'); });
   */
  off<T extends CoreEventType>(event: T, handler: EventHandler<T>, route?: string): void {
    if (!this.events[event]) return;

    this.events[event] = this.events[event]!.filter((listener) => {
      return listener.handler !== handler || (route && (listener as { route: string }).route !== route);
    });
  }

  /**
   * Clear all listeners for a specific event or all events.
   *
   * @param event - The event type to clear (optional).
   */
  clear(event?: CoreEventType): void {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
  }

  /**
   * Emit an event, calling all registered listeners.
   *
   * @param event - The event type (e.g., `CoreEventType.Route`, `CoreEventType.Start`).
   * @param context - The context object to pass to the listeners.
   * @example
   * app.emit('route', { route: 'users/:id', params: { id: '123' } });
   * app.emit('start', { timestamp: new Date() });
   */
  async emit<T extends CoreEventType>(event: T, context: LifecycleEvents[keyof LifecycleEvents]): Promise<void> {
    const listeners: EventHandler<any> = this.events[event];
    if (!listeners) return;

    for (const listener of listeners) {
      if (typeof listener === 'function') {
        await listener(context);
      } else if (typeof listener === 'object' && 'handler' in listener) {
        await listener.handler(context);
      }
    }
  }

  /**
   * Get all listeners for a specific event or all events.
   *
   * If no event type is provided, it returns the listeners for all events.
   *
   * @param event - The event type (optional). If provided, returns listeners for the specific event. If not, returns listeners for all events.
   * @returns An array of registered listeners for the specified event, or an array of all listeners if no event is specified.
   */
  getListeners<T extends CoreEventType>(event?: T): EventHandler<T>[] | EventHandler<any>[] {
    if (event) {
      // Return listeners for the specified event type.
      return (this.events[event] || []).map((listener) => listener.handler);
    }

    // Return listeners for all event types if no specific event is provided.
    return Object.values(this.events)
      .flat()
      .map((listener) => listener.handler);
  }
}
