import { WebContext } from '../core/context';
import { Request } from '../core/context/request';
import { Response } from '../core/context/response';
export type MetadataKey = string | symbol;
export type MetadataValue = any;
export type MetadataMap = Map<MetadataKey, MetadataValue>;
export type MetadataTarget = object;
export type MetadataStorage = WeakMap<MetadataTarget, Map<MetadataKey, MetadataValue>>;
export interface RQ extends Request<Record<string, string>> {
  [key: string]: any;
}

export interface RS extends Response {
  [key: string]: any;
}
export type URLParams<T extends Record<string, string | undefined>> = {
  [K in keyof T]: T[K] extends string ? string : never;
};
export type Context = WebContext & RQ & RS;
