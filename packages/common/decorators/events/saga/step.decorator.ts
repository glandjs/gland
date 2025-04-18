import { METHOD_METADATA } from '../../../constant';

/**
 * @publicApi
 */
export function Step(opts: { index: number }): MethodDecorator {
  return (target: object, key: string | symbol) => {
    Reflect.defineMetadata(METHOD_METADATA, opts, target, key);
  };
}
