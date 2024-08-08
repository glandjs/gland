import { IncomingMessage, ServerResponse } from 'http';
export type MetadataKey = string | symbol;
export type MetadataValue = any;
export type MetadataMap = Map<MetadataKey, MetadataValue>;
export type MetadataTarget = object;
export type MetadataStorage = WeakMap<MetadataTarget, Map<MetadataKey, MetadataValue>>;
export interface RQ extends IncomingMessage {
  [key: string]: any;
}
export interface RS extends ServerResponse<IncomingMessage> {
  [key: string]: any;
}
export type Context = RQ & RS ;

export type URLParams<T extends Record<string, string | undefined>> = {
  [K in keyof T]: T[K] extends string ? string : never;
};