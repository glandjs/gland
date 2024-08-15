import Reflect from "../../metadata/metadata";

export function mid(fn: Function): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const existingMids = Reflect.get('middlewares', target, propertyKey) || [];
    Reflect.init('middlewares', [...existingMids, fn], target, propertyKey);
  };
}

export function mids(...fns: Function[]): ClassDecorator {
  return (target: any) => {
    Reflect.init('classMiddlewares', fns, target.prototype);
  };
}
