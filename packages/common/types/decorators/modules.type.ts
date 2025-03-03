import { DynamicModule, ModuleMetadata } from '../../interfaces';
import { Constructor } from '@medishn/toolkit';
export type ImportableModule<T = any> = Constructor<T> | DynamicModule<T>;

export type InjectionToken<T = any> = string | symbol | Constructor<T> | Function;

export type ModuleType<T = any> = Constructor<T> | ModuleMetadata<T>;

export type ApiController<T = any> = Constructor<T>;
export type ApiChannel<T = any> = Constructor<T>;
