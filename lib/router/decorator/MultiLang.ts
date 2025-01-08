import Reflector from '../../metadata';

export function MultiLang(routes: { [key: string]: string }): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflector.define('multiLangRoutes', { [propertyKey as string]: routes }, target.constructor);
  };
}
