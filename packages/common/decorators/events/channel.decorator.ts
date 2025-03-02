import { PATH_METADATA } from '@gland/common/constant';

/**
 * @publicApi
 */
export function Channel(stream?: string): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(PATH_METADATA, stream, target);
  };
}
