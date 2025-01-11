import { RouterMetadataKeys } from '../../common/constants';
import Reflector from '../../metadata';
import { ServerRequest } from '../../types';

export function Transform(transformFn: (ctx: ServerRequest) => void): MethodDecorator {
  return (target: any, propertyKey) => {
    Reflector.define(RouterMetadataKeys.TRANSFORM, transformFn, target.constructor, propertyKey);
  };
}
