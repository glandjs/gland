import { Constructor } from '@medishn/toolkit';
import { ImportableModule, InjectionToken, Streams } from '../types';

export interface ModuleMetadata<T = any> {
  imports?: ImportableModule<T>[];
  gateways?: Constructor<T>[];
  streams?: Streams<T>[];
  shareds?: InjectionToken<T>[];
}
export interface DynamicModule<T = any> extends ModuleMetadata<T> {
  module: Constructor<any>;
}
