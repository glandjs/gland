import 'reflect-metadata';
import { EVENTS_METADATA } from '../constant';
import { Constructor, determineDecoratorType, getConstructor, isNil, isObject } from '@gland/common';
import { QualifiedEvent } from '../types';
import { EventManager } from '../core';
import { EmitHandlers } from './handlers';
import { EventEmitMethodOptions } from '../interface';
function EmitEvent<Q extends string, T, D = any>(qualified: QualifiedEvent<Q>, options?: EventEmitMethodOptions<D>): MethodDecorator & ClassDecorator {
  return function (target: any, _?: string | symbol, descriptor?: PropertyDescriptor | number) {
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
        });
        return target;

      case 'method':
        if (isObject(descriptor) && !isNil(descriptor)) {
          EmitHandlers.methodHandler({
            descriptor,
            eventManager,
            qualified,
            options: options,
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
// method-level
export function Emit<Q extends string, D, T extends Function>(qualified: QualifiedEvent<Q>, options?: EventEmitMethodOptions<D>) {
  return EmitEvent<Q, T, D>(qualified, options);
}
// class-level
export function Emits<Q extends string, D, T extends Constructor>(qualified: QualifiedEvent<Q>) {
  return EmitEvent<Q, T, D>(qualified);
}
