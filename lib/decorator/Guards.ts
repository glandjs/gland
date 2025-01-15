import { RouterMetadataKeys } from '../common/enums';
import { ServerRequest } from '../common/interfaces';
import Reflector from '../metadata';

export function Guard(...guards: ((ctx: ServerRequest) => void | Promise<void>)[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflector.define(RouterMetadataKeys.GUARDS, guards, target.constructor, propertyKey);
  };
}
