import { MODULE_METADATA } from '@gland/common/constant';
import { ModuleMetadata } from '@gland/common/interfaces';
/**
 * @param metadata module configuration metadata
 * @publicApi
 */
export function Module(metadata: ModuleMetadata<any>): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(MODULE_METADATA, metadata, target);
  };
}
