import { ClassProvider, Constructor, ExistingProvider, FactoryProvider, ValueProvider } from '../interfaces';

export type InjectionToken<T = any> = string | symbol | Constructor<T> | Function;
export type Provider<T = any> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T> | ExistingProvider;
