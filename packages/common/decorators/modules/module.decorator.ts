import { MODULE_METADATA } from '@gland/common/constant';
import { ModuleMetadata } from '@gland/common/interfaces';
/**
 * @param metadata module configuration metadata
 * @publicApi
 */
export function Module(metadata: ModuleMetadata<any>): ClassDecorator {
  const propsKeys = Object.keys(metadata);
  return (target: Function) => {
    Reflect.defineMetadata(MODULE_METADATA.MODULE_METADATA_WATERMARK, true, target);
    Reflect.defineMetadata(MODULE_METADATA.MODULE_METADATA, metadata, target);
  };
}
