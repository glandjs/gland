import { Constructor } from '@medishn/toolkit';
import { ApiChannel, ApiController, ImportableModule, InjectionToken } from '../types';

export interface ModuleMetadata<T = any> {
  imports?: ImportableModule<T>[];
  controllers?: ApiController<T>[];
  channels?: ApiChannel<T>[];
  exports?: InjectionToken<T>[];
}
export interface DynamicModule<T = any> extends ModuleMetadata<T> {
  module: Constructor<any>;
}
