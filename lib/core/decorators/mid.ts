import Reflect from '../../metadata/metadata';
import { MidsFn } from '../../types/types';

function normalize(middleware: MidsFn | MidsFn[]): MidsFn[] {
  return Array.isArray(middleware) ? middleware : [middleware];
}

export function mid(middleware: MidsFn | MidsFn[]): MethodDecorator | any {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void | PropertyDescriptor => {
    const existingMids = Reflect.get('middlewares', target, propertyKey) || [];
    const newMids = normalize(middleware);
    Reflect.init('middlewares', [...existingMids, ...newMids], target, propertyKey);
    return descriptor;
  };
}

export function mids(middlewareArray: MidsFn[] | MidsFn): ClassDecorator {
  return (target: any) => {
    const newMids = normalize(middlewareArray);
    Reflect.init('classMiddlewares', newMids, target.prototype);
  };
}