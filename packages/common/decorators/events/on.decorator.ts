import { EventIdentifier } from '@gland/common/types';
import { METHOD_METADATA } from '../../constant';

/**
 * @publicApi
 */
export function On<T extends string>(event: EventIdentifier<T>): MethodDecorator {
  return (target: object, key: string | symbol) => {
    Reflect.defineMetadata(METHOD_METADATA, event, target, key);
  };
}
