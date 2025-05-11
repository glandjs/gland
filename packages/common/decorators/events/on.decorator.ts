import { METHOD_METADATA } from '../../constant';

/**
 * @publicApi
 */
export function On(event: string): MethodDecorator {
  return (target: object, key: string | symbol) => {
    Reflect.defineMetadata(METHOD_METADATA, event, target, key);
  };
}
