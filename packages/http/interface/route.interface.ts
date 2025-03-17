import { RequestMethod } from '@gland/common';
import { HttpContext } from './http-context.interface';

export type RouteAction = (ctx: HttpContext) => any | Promise<any>;

export interface RouteMatch {
  method: RequestMethod;
  path: string;
  action: RouteAction;
  params: Record<string, string>;
}
