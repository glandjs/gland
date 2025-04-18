import { METHOD_METADATA } from '../../../constant';

/**
 * @publicApi
 */
export function Compensate(): MethodDecorator {
  return (target: object, key: string | symbol) => {
    Reflect.defineMetadata(METHOD_METADATA, {}, target, key);
  };
}
