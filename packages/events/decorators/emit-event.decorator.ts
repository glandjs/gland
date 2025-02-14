import 'reflect-metadata';
import { EVENTS_METADATA } from '../constant';
import { Constructor, determineDecoratorType, getConstructor } from '@gland/common';
import { QualifiedEvent } from '../types';
import { EventManager } from '../core';
import { EmitHandlers } from './handlers';
import { EventEmitClassOptions, EventEmitMethodOptions } from '../interface';
type EmitOptions<T, D> = T extends Constructor<infer _> ? EventEmitClassOptions<D> : EventEmitMethodOptions;

function EmitEvent<T, D = any>(qualified: QualifiedEvent, options?: EmitOptions<T, D>): MethodDecorator & ClassDecorator {
  return function (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor | number) {
    const eventManager: EventManager = Reflect.getMetadata(EVENTS_METADATA.EVENT_MANAGER, EventManager);
    if (!eventManager) {
      throw new Error('EventManager must be initialized before using @EmitEvent decorator');
    }
    const constructor = getConstructor(target);
    switch (determineDecoratorType(arguments)) {
      case 'class':
        EmitHandlers.classHandler({
          data: (options as any).data,
          eventManager,
          qualified,
        });
        return target;

      case 'method':
        if (typeof descriptor === 'object' && descriptor !== null) {
        } else {
          throw new Error('@EmitEvent can only be used on methods with a valid PropertyDescriptor.');
        }
        break;

      default:
        throw new Error('Invalid usage of @EmitEvent decorator.');
    }
  };
}
export function EmitMethod<D, T extends Function>(qualified: QualifiedEvent, options?: EmitOptions<T, D>) {
  return EmitEvent(qualified, options);
}
export function EmitClass<D, T extends Constructor>(qualified: QualifiedEvent, options?: EmitOptions<T, D>) {
  return EmitEvent(qualified, options);
}
