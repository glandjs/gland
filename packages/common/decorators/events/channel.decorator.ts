import { PATH_METADATA } from '../../constant';
import type { EventType } from '../../types';

/**
 * @publicApi
 */
export function Channel(event?: EventType): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(PATH_METADATA, event, target);
  };
}
