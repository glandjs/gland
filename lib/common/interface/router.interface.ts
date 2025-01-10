import { MetadataTarget } from '../../metadata/Reflect.interface';
import { MiddlewareFn } from './middleware.interface';

export interface RouteDefinition {
  method: string;
  path: string;
  constructor: MetadataTarget;
  action: Function;
  middlewares?: MiddlewareFn[];
  params: { [key: string]: string };
  query: Record<string, string | number | undefined>;
}
