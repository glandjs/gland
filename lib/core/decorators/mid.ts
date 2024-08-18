import { ServerUtils } from '../../helper';
import Reflect from '../../metadata/metadata';
import { MidsFn } from '../../types/types';
export function mid(middleware: MidsFn | MidsFn[]): MethodDecorator | any {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void => {
    const existingMids = Reflect.get('middlewares', target.constructor.prototype, propertyKey) || [];
    const newMids = ServerUtils.normalize(middleware);
    Reflect.init('middlewares', [...existingMids, ...newMids], target.constructor.prototype, propertyKey);
  };
}

export function mids(middlewareArray: MidsFn[] | MidsFn): ClassDecorator {
  return (target: any) => {
    const newMids = ServerUtils.normalize(middlewareArray);
    Reflect.init('classMiddlewares', newMids, target.prototype);
  };
}
