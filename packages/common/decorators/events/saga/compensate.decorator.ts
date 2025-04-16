import { METHOD_METADATA } from '../../../constant';
import type { EventType } from '../../../types';

/**
 * @publicApi
 */
export function Compensate(event: EventType): MethodDecorator {
  return (target: object, key: string | symbol) => {
    Reflect.defineMetadata(METHOD_METADATA, event, target, key);
  };
}
