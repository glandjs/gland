import { EventOnClassOptions, EventOnMethodOptions } from '../../interface';
import { EventManager } from '../../core';
import { Event, IEventType, QualifiedEvent } from '../../types';
import { isFunction, isString, isSymbol } from '@gland/common';

export namespace OnHandlers {
  /**
   * Registers all methods on the target class's prototype as event handlers for a given qualified event,
   * but only for methods that have not already been subscribed.
   *
   * This function iterates over all properties of the target's prototype. For each property that is a function,
   * it checks for a custom flag (`__sub__`) on the function. If the flag is not set, the method is bound to the
   * target's prototype and subscribed to the event manager using the provided qualified event. This ensures
   * that methods which have already been registered (and thus have the `__sub__` flag set to true) are not subscribed again.
   *
   * @param target - The class whose prototype methods will be registered as event handlers.
   * @param qualified - The qualified event identifier (e.g., "server:start:pre") to which the methods will subscribe.
   * @param eventManager - The instance of EventManager that will handle the subscription of event handlers.
   *
   * @remarks
   * Methods that have been already subscribed should have the `__sub__` property set to `true` to avoid duplicate subscriptions.
   */
  export function classDecorator(target: any, qualified: QualifiedEvent, eventManager: EventManager, options?: EventOnClassOptions) {
    const prototype = target.prototype;
    // 🚨 Validate that only one of 'pick' or 'omit' is used
    if (options?.pick && options?.omit) {
      throw new Error("Invalid decorator usage: You cannot use both 'pick' and 'omit' together.");
    }

    // Normalize pick/omit to arrays
    const pickArray = options?.pick ? (Array.isArray(options.pick) ? options.pick : [options.pick]) : [];

    const omitArray = options?.omit ? (Array.isArray(options.omit) ? options.omit : [options.omit]) : [];

    Reflect.ownKeys(prototype).forEach((propertyKey) => {
      if (!isString(propertyKey) && !isSymbol(propertyKey)) return;
      if (propertyKey === 'constructor') return;

      const handler = prototype[propertyKey];
      if (!isFunction(handler) || handler.__sub__) {
        return;
      }

      const methodName = propertyKey.toString();
      const isExplicitlyPicked = pickArray.length > 0 ? pickArray.includes(methodName) : true;

      const isExplicitlyOmitted = omitArray.includes(methodName);

      if (isExplicitlyPicked && !isExplicitlyOmitted) {
        eventManager.on(qualified, handler.bind(prototype));
        handler.__sub__ = true;
      }
    });
  }

  export function methodDecorator<T extends IEventType>(
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
    qualified: QualifiedEvent,
    eventManager: EventManager,
    options?: EventOnMethodOptions<T>,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (event: Event<T>) {
      try {
        let transformedEvent = event;

        if (options?.transform) {
          transformedEvent = options.transform(structuredClone(event));
        }

        if (options?.retry) {
          let attempt = 0;
          while (true) {
            try {
              return await originalMethod.call(this, transformedEvent);
            } catch (error) {
              attempt++;
              if (options.retry.delay > 0) {
                await new Promise((resolve) => setTimeout(resolve, options.retry!.delay));
              }

              if (attempt > options.retry.max) {
                throw error;
              }
            }
          }
        }

        return originalMethod.call(this, transformedEvent);
      } catch (error) {
        throw error;
      }
    };

    descriptor.value.__sub__ = true;
    eventManager.on(qualified, descriptor.value.bind(target));
  }
}
