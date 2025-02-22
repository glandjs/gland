import { RequestMethod } from '../enums';
import { Context } from './application';

export type RouteAction = (ctx: Context, ...args: any[]) => any | Promise<any>;

export interface RouteMatch {
  method: RequestMethod;
  path: string;
  action: RouteAction;
  params: Record<string, string>;
}
export interface RouteMetadata {
  modulePath?: string;
  gatewayPath?: string;
  actionPath?: string;
}
