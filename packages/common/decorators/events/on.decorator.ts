import { EventType } from '../../types';
import { METHOD_METADATA } from '../../constant';

/**
 * @publicApi
 */
export function On(event: EventType): MethodDecorator {
  return (target: object, key: string | symbol) => {
    Reflect.defineMetadata(METHOD_METADATA, event, target, key);
  };
}
