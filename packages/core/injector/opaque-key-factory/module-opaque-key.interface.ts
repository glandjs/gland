import { Constructor } from '@medishn/toolkit';

export interface ModuleOpaqueKeyFactory {
  createForStatic(moduleCls: Constructor): string;
}
