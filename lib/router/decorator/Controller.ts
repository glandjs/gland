import { RouterMetadataKeys } from '../../common/constants';
import Reflector from '../../metadata/index';

export function Controller(prefix: string): ClassDecorator {
  return (target) => {
    const existingPrefix = Reflector.get(RouterMetadataKeys.CONTROLLER_PREFIX, target);
    let fullPrefix = prefix;
    if (existingPrefix) {
      fullPrefix = `${existingPrefix}${prefix}`.replace(/\/+$/, '');
    }
    Reflector.define(RouterMetadataKeys.CONTROLLER_PREFIX, fullPrefix, target);
  };
}
