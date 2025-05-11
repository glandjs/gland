import { DynamicModule } from '../interfaces';

export const normalizePath = (path?: string): string => (path ? (path.startsWith('/') ? ('/' + path.replace(/\/+$/, '')).replace(/\/+/g, '/') : '/' + path.replace(/\/+$/, '')) : '/');

export function isDynamicModule(module: any): module is DynamicModule {
  return !!module?.module;
}
