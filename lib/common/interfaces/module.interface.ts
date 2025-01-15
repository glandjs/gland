import { InjectionToken, Provider } from '../types';

export interface Constructor<T = any> extends Function {
  new (...args: any[]): T;
}

export interface ClassProvider<T = any> {
  provide: InjectionToken;
  useClass: Constructor<T>;
  scope?: 'singleton' | 'transient'; // Option for scope (singleton, transient, etc.)
}

export interface ValueProvider<T = any> {
  provide: InjectionToken;
  useValue: T;
}

export interface FactoryProvider<T = any> {
  provide: InjectionToken;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: InjectionToken[]; // Dependencies to be injected into the factory function
}

export interface ExistingProvider {
  provide: InjectionToken;
  useExisting: InjectionToken; // An alias for another provider
}

export interface ModuleMetadata {
  controllers?: Constructor<any>[];

  providers?: Provider[];
}
