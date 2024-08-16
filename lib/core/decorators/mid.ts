import Reflect from '../../metadata/metadata';
import { MidsFn } from '../../types/types';

export function mid(fn: MidsFn): MethodDecorator | any {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void | PropertyDescriptor => {
    const existingMids = Reflect.get('middlewares', target, propertyKey) || [];
    Reflect.init('middlewares', [...existingMids, fn], target, propertyKey);
    return descriptor;
  };
}

export function mids(...fns: MidsFn[]): ClassDecorator {
  return (target: any) => {
    Reflect.init('classMiddlewares', fns, target.prototype);
  };
}
