import { RouterMetadataKeys } from '../../common/constants';
import Reflector from '../../metadata';
import { HttpContext } from '../../types';

export function Transform(transformFn: (ctx: HttpContext) => void): MethodDecorator {
  return (target: any, propertyKey) => {
    Reflector.define(RouterMetadataKeys.TRANSFORM, transformFn, target.constructor, propertyKey);
  };
}
