import { SAGA_METADATA } from '../../../constant';
import type { EventType } from '../../../types';

/**
 * @publicApi
 */
export function Saga(opts: { event: EventType; compensation: EventType }): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(SAGA_METADATA, opts, target);
  };
}
