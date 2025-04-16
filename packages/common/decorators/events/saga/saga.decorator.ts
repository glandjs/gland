import { SAGA_METADATA } from '../../../constant';
import type { EventType } from '../../../types';

/**
 * @publicApi
 */
export function Saga(event: EventType): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(SAGA_METADATA, event, target);
  };
}
