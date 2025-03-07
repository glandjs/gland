import { MODULE_METADATA } from '../../constant';
import { ModuleMetadata } from '../../interfaces';

/**
 * @publicApi
 */
export function Module(metadata: ModuleMetadata<any>): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(MODULE_METADATA, metadata, target);
  };
}
