import { Constructor } from '@medishn/toolkit';
import { ImportableModule, InjectionToken } from '../types';

export interface ModuleMetadata<T = any> {
  imports?: ImportableModule<T>[];
  controllers?: Constructor<T>[];
  channels?: Constructor<T>[];
}

export interface DynamicModule<T = any> {
  controllers?: Constructor[];
  channels?: Constructor[];
  imports?: ImportableModule<T>[];
  exports?: InjectionToken<T>[];
  module: Constructor<any>;
  /**
   * @default false
   */
  global?: boolean;
}
