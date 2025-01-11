import { RouterMetadataKeys } from '../../common/constants';
import Reflector from '../../metadata';
import { ServerRequest } from '../../types';

export function Guard(...guards: ((ctx: ServerRequest) => void | Promise<void>)[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflector.define(RouterMetadataKeys.GUARDS, guards, target.constructor, propertyKey);
  };
}
