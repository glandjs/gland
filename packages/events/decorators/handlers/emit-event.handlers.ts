import { QualifiedEvent } from '@gland/events/types';
import { EventManager } from '../../core/event-manager';
import { EventEmitMethodOptions } from '../../interface';
import { EventMapper } from '@gland/events/utils/event-mapper';
import { isFunction, isString, isSymbol } from '@gland/common';
export namespace EmitHandlers {
  /**
   * Handles class-level event emission.
   * - Publishes events for all methods unless explicitly omitted.
   * - Supports inheritance of emission rules.
   */
  export function classHandler({ target, eventManager, qualified }: { target: any; eventManager: EventManager; qualified: QualifiedEvent }) {
    const prototype = target.prototype;

    // Iterate over all methods in the prototype
    Reflect.ownKeys(prototype).forEach((propertyKey) => {
      if (!isString(propertyKey) && !isSymbol(propertyKey)) return;
      if (propertyKey === 'constructor') return;

      const handler = prototype[propertyKey];
      if (!isFunction(handler) || handler.__emitted) return;

      // Bind the method and emit events
      prototype[propertyKey] = function (...args: any[]) {
        const result = handler.apply(this, args);
        eventManager.emit(qualified, result);
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
      const maxRetries = options?.retry?.max ?? 0;
      const retryDelay = options?.retry?.delay ?? 0;

      while (true) {
        try {
          const result = await originalMethod.apply(this, args);
          eventManager.emit(qualified, result);
          return result;
        } catch (error) {
          if (retryCount >= maxRetries) {
            const { phase, type } = EventMapper.parseQualifiedEvent(qualified);
            eventManager.emit(`${type}:error`, { error, args });
            throw error;
          }

          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    };
  }
}
