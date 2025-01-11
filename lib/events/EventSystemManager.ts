import { CoreEventType, EventHandler, ContextHandler } from './EventSystem.interface';
import { EventSystem } from './EventSystem';

/**
 * EventSystemManager is a wrapper for EventSystem, ensuring correct usage of event handlers and emitted data with type safety.
 */
export class EventSystemManager {
  private readonly eventSystem: EventSystem;

  constructor() {
    this.eventSystem = new EventSystem();
  }

  /**
   * Register a listener for a route event with a specific route.
   *
   * @param route - The route path to attach the listener to.
   * @param handler - The event handler for the route.
   * @example
   * appEventManager.onRoute('users/:id', (ctx) => {
   *   console.log(`User route triggered with ID: ${ctx.params.id}`);
   * });
   */
  onRoute(route: string, handler: EventHandler<CoreEventType.Route>): void {
    this.eventSystem.on(CoreEventType.Route, route, handler);
  }

  /**
   * Register a listener for a generic event (not route-based).
   *
   * @param event - The event type (any of CoreEventType).
   * @param handler - The event handler.
   * @example
   * appEventManager.on('start', (ctx) => {
   *   console.log('Server started');
   * });
   */
  on<T extends CoreEventType>(event: T, handler: EventHandler<T>): void {
    this.eventSystem.on(event, handler);
  }

  /**
   * Register a one-time listener for a route event with a specific route.
   *
   * @param route - The route path to attach the listener to.
   * @param handler - The event handler for the route.
   * @example
   * appEventManager.onceRoute('users/:id', (ctx) => {
   *   console.log('User route triggered once with ID:', ctx.params.id);
   * });
   */
  onceRoute(route: string, handler: EventHandler<CoreEventType.Route>): void {
    this.eventSystem.once(CoreEventType.Route, route, handler);
  }

  /**
   * Register a one-time listener for a generic event (not route-based).
   *
   * @param event - The event type (any of CoreEventType).
   * @param handler - The event handler.
   * @example
   * appEventManager.once('start', (ctx) => {
   *   console.log('Server started once');
   * });
   */
  once<T extends CoreEventType>(event: T, handler: EventHandler<T>): void {
    this.eventSystem.once(event, handler);
  }

  /**
   * Remove a specific listener for an event.
   *
   * @param event - The event type (e.g., CoreEventType.Route, CoreEventType.Start).
   * @param handler - The event handler to remove.
   * @param route - Optional route for route events.
   * @example
   * appEventManager.off('route', (ctx) => { console.log('Removing listener for user route'); }, 'users/:id');
   * appEventManager.off('start', (ctx) => { console.log('Removing start event listener'); });
   */
  off<T extends CoreEventType>(event: T, handler: EventHandler<T>, route?: string): void {
    this.eventSystem.off(event, handler, route);
  }

  /**
   * Clear all listeners for a specific event or all events.
   *
   * @param event - The event type to clear (optional).
   */
  clear(event?: CoreEventType): void {
    this.eventSystem.clear(event);
  }

  /**
   * Emit an event, calling all registered listeners.
   *
   * @param event - The event type (e.g., CoreEventType.Route, CoreEventType.Start).
   * @param context - The context object to pass to the listeners.
   * @example
   * appEventManager.emit('route', { route: 'users/:id', params: { id: '123' } });
   * appEventManager.emit('start', { timestamp: new Date() });
   */
  emit<T extends CoreEventType>(event: T, context: ContextHandler[keyof ContextHandler]): void {
    this.eventSystem.emit(event, context);
  }
  /**
   * Get all listeners for a specific event or for all events if no event is specified.
   *
   * @param event - The specific event type. If omitted, listeners for all events are returned.
   * @returns An array of registered listeners for the specified event or for all events.
   */
  getListeners<T extends CoreEventType>(event: T): EventHandler<T>[];
  getListeners(): EventHandler<any>[];
  getListeners(event?: CoreEventType): EventHandler<any>[] {
    if (event) {
      return this.eventSystem.getListeners(event);
    } else {
      return this.eventSystem.getListeners();
    }
  }
}
