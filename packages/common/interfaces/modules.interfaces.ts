import { Constructor } from '@medishn/toolkit';
import { ApiChannel, ApiController, ImportableModule, InjectionToken } from '../types';

export interface ModuleMetadata<T = any> {
  imports?: ImportableModule<T>[];
  controllers?: ApiController<T>[];
  channels?: ApiChannel<T>[];
  sagas?: Constructor<T>[];
}

export interface DynamicModule<T = any> {
  imports?: ImportableModule<T>[];
  exports?: InjectionToken<T>[];
  module: Constructor<any>;
  /**
   * @default false
   */
  global?: boolean;
}
