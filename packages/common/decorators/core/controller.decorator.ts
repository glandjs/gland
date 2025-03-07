import { PATH_METADATA } from '../../constant';

/**
 * @publicApi
 */
export function Controller(path?: string): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(PATH_METADATA, path, target);
  };
}
