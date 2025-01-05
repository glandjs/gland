import { ROUTER_PREFIX_KEY } from '../../common/constants';
import Reflector from '../../metadata/index';
export function Controller(prefix: string): ClassDecorator {
  return (target: Function): void => {
    Reflector.define(ROUTER_PREFIX_KEY, prefix, target);
  };
}
