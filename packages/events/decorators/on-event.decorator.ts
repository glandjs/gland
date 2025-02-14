import 'reflect-metadata';
import { EVENTS_METADATA } from '../constant';
import { Constructor, determineDecoratorType, getConstructor } from '@gland/common';
import { QualifiedEvent } from '../types';
import { EventManager } from '../core';
import { OnHandlers } from './handlers';
import { EventOnClassOptions, EventOnMethodOptions } from '../interface';
type EventOptions<T> = T extends Constructor<infer _> ? EventOnClassOptions : EventOnMethodOptions;

function OnEvent<T>(event: QualifiedEvent, options?: EventOptions<T>): MethodDecorator & ClassDecorator {
  return function (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    const eventManager = Reflect.getMetadata(EVENTS_METADATA.EVENT_MANAGER, EventManager);
    if (!eventManager) {
      throw new Error('EventManager must be initialized before using @OnEvent decorator');
    }
    const constructor = getConstructor(target);

    switch (determineDecoratorType(arguments)) {
      case 'class':
        OnHandlers.classDecorator(constructor, event, eventManager, options as EventOnClassOptions);
        return target;
      case 'method':
        if (typeof descriptor === 'object' && descriptor !== null) {
          OnHandlers.methodDecorator(constructor, propertyKey!, descriptor, event, eventManager, options as EventOnMethodOptions);
        } else {
          throw new Error('@OnEvent can only be used on methods with a valid PropertyDescriptor.');
        }
        break;
      default:
        throw new Error('Invalid usage of @OnEvent decorator.');
    }
  };
}

// Method-specific decorator
function OnMethod<T extends Function>(event: QualifiedEvent, options?: EventOptions<T>): MethodDecorator {
  return OnEvent<T>(event, options);
}
// Class-specific decorator
function OnClass<T extends Constructor>(event: QualifiedEvent, options?: EventOptions<T>): ClassDecorator {
  return OnEvent<T>(event, options);
}
export { OnClass, OnMethod };
