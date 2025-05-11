import { DynamicModule } from '../interfaces';
import { Constructor } from '@medishn/toolkit';
export type ImportableModule<T = any> = Constructor<T> | DynamicModule | Promise<DynamicModule>;

export type InjectionToken<T = any> = string | symbol | Constructor<T> | Function;
