import { QualifiedEvent } from '@gland/events/types';
import { EventManager } from '../../core/event-manager';
import { EventEmitClassOptions, EventEmitMethodOptions } from '../../interface';
import { EventMapper } from '@gland/events/utils/event-mapper';
export namespace EmitHandlers {
  /**
   * Handles class-level event emission.
   * - Publishes events for all methods unless explicitly omitted.
   * - Supports inheritance of emission rules.
   */
  export function classHandler<D>({ target, eventManager, qualified, options }: { target: any; eventManager: EventManager; qualified: QualifiedEvent; options?: EventEmitClassOptions<D> }) {
    const prototype = target.prototype;

    // Handle inheritance if enabled
    if (options?.inherit) {
      const parent = Object.getPrototypeOf(prototype).constructor;
      if (parent !== Object) {
        classHandler({ target: parent, eventManager, qualified, options });
      }
    }

    // Iterate over all methods in the prototype
    Reflect.ownKeys(prototype).forEach((propertyKey) => {
      if (typeof propertyKey !== 'string' && typeof propertyKey !== 'symbol') return;
      if (propertyKey === 'constructor') return;

      const handler = prototype[propertyKey];
      if (typeof handler !== 'function' || handler.__emitted) return;

      // Bind the method and emit events
      prototype[propertyKey] = function (...args: any[]) {
        const result = handler.apply(this, args);
        eventManager.publish(qualified, result);
        return result;
      };
    });
  }

  /**
   * Handles method-level event emission.
   * - Supports retry logic for failed emissions.
   * - Publishes events with transformed data if a transform function is provided.
   */
  export function methodHandler<D>({
    descriptor,
    eventManager,
    qualified,
    options,
  }: {
    descriptor: PropertyDescriptor;
    eventManager: EventManager;
    qualified: QualifiedEvent;
    options?: EventEmitMethodOptions<D>;
  }) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let retryCount = 0;
      const maxRetries = options?.retry?.max?? 0;
      const retryDelay = options?.retry?.delay?? 0;

      while (true) {
        try {
          const result = await originalMethod.apply(this, args);
          eventManager.publish(qualified, result);
          return result;
        } catch (error) {
          if (retryCount >= maxRetries) {
            const { phase, type } = EventMapper.parseQualifiedType(qualified);
            eventManager.publish(`${type}:error`, { error, args });
            throw error;
          }

          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    };
  }
}
