import { PATH_METADATA } from '../../constant';

/**
 * @publicApi
 */
export function Channel(event?: string): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(PATH_METADATA, event, target);
  };
}
