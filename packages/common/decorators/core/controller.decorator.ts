import { PATH_METADATA } from '@gland/common/constant';

/**
 * @publicApi
 */
export function Controller(path?: string): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(PATH_METADATA, path, target);
  };
}
