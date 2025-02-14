import 'reflect-metadata';
import { EVENTS_METADATA } from '../constant';
import { Constructor, determineDecoratorType, getConstructor } from '@gland/common';
import { QualifiedEvent } from '../types';
import { EventManager } from '../core';
import { EmitHandlers } from './handlers';
import { EventEmitClassOptions, EventEmitMethodOptions } from '../interface';
type EmitOptions<T, D> = T extends Constructor<infer _> ? EventEmitClassOptions<D> : EventEmitMethodOptions<D>;

function EmitEvent<Q extends string, T, D = any>(qualified: QualifiedEvent<Q>, options?: EmitOptions<T, D>): MethodDecorator & ClassDecorator {
  return function (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor | number) {
    const eventManager: EventManager = Reflect.getMetadata(EVENTS_METADATA.EVENT_MANAGER, EventManager);
    if (!eventManager) {
      throw new Error('EventManager must be initialized before using @EmitEvent decorator');
    }
    const constructor = getConstructor(target);
    switch (determineDecoratorType(arguments)) {
      case 'class':
        EmitHandlers.classHandler({
          target: constructor,
          eventManager,
          qualified,
          options: options as EventEmitClassOptions<D>,
        });
        return target;

      case 'method':
        if (typeof descriptor === 'object' && descriptor !== null) {
          EmitHandlers.methodHandler({
            descriptor,
            eventManager,
            qualified,
            options: options as EventEmitMethodOptions<D>,
          });
        } else {
          throw new Error('@EmitEvent can only be used on methods with a valid PropertyDescriptor.');
        }
        break;

      default:
        throw new Error('Invalid usage of @EmitEvent decorator.');
    }
  };
}
export function EmitMethod<Q extends string, D, T extends Function>(qualified: QualifiedEvent<Q>, options?: EmitOptions<T, D>) {
  return EmitEvent<Q, T, D>(qualified, options);
}
export function EmitClass<Q extends string, D, T extends Constructor>(qualified: QualifiedEvent<Q>, options?: EmitOptions<T, D>) {
  return EmitEvent<Q, T, D>(qualified, options);
}
