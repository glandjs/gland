import Reflect from '../../metadata/metadata';

export const routes = new Map<string, any>();

export function Route(path: string): ClassDecorator {
  return (target: any) => {
    routes.set(path, target);
  };
}

export function Get(path: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.init('method', 'GET', target, propertyKey);
    Reflect.init('path', path, target, propertyKey);
  };
}

export function Post(path: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.init('method', 'POST', target, propertyKey);
    Reflect.init('path', path, target, propertyKey);
  };
}
