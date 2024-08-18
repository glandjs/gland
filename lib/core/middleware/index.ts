import { ServerUtils } from '../../helper';
import { MidsFn } from '../../types/types';

export namespace Gmid {
  let mids: MidsFn[] = [];

  export function set(middleware: MidsFn | MidsFn[]) {
    mids = [...mids, ...ServerUtils.normalize(middleware)];
  }

  export function get(): MidsFn[] | [] {
    return mids || [];
  }
}
