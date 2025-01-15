import { MetadataTarget } from './reflect.interface';
import { MiddlewareFn } from '../types';

export interface RouteDefinition {
  method: string;
  path: string;
  constructor: MetadataTarget;
  action: Function;
  middlewares?: MiddlewareFn[];
  params: { [key: string]: string };
  query: Record<string, string | number | undefined>;
}
