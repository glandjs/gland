import { RouterMetadataKeys } from '../../common/constants';
import Reflector from '../../metadata';
import { HttpContext } from '../../types';

export function Guard(...guards: ((ctx: HttpContext) => void | Promise<void>)[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflector.define(RouterMetadataKeys.GUARDS, guards, target.constructor, propertyKey);
  };
}
