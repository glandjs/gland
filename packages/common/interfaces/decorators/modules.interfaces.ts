import { Constructor } from '../../interfaces';
import { ImportableModule, InjectionToken, Streams } from '../../types';

export interface ModuleMetadata<T = any> {
  imports?: ImportableModule<T>[];
  gateways?: Constructor<T>[];
  streams?: Streams<T>[];
  exports?: InjectionToken<T>[];
}
