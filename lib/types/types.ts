import { IncomingMessage, ServerResponse } from 'http';
import { WebContext } from '../core/context';
export type MetadataKey = string | symbol;
export type MetadataValue = any;
export type MetadataMap = Map<MetadataKey, MetadataValue>;
export type MetadataTarget = object;
export type MetadataStorage = WeakMap<MetadataTarget, Map<MetadataKey, MetadataValue>>;
export interface RQ extends IncomingMessage {
  [key: string]: any;
}

export interface RS extends ServerResponse {
  [key: string]: any;
}
export type URLPrams<T extends Record<string, string | undefined>> = {
  [K in keyof T]: T[K] extends string ? string : never;
};
export type Context = WebContext & RQ & RS;
export type MidsFn = (ctx: Context, next: Function) => any;
export type RouteHandler = new (...args: any[]) => any | ((...args: any[]) => any);
export interface StaticOptions {
  index?: string | boolean; // Index file to use (e.g., "index.html")
  etag?: boolean; // Enable/disable ETag headers
  lastModified?: boolean; // Enable/disable Last-Modified headers
  maxAge?: number; // Cache-Control max-age in milliseconds
  cacheControl?: boolean; // Enable/disable Cache-Control headers
  dotfiles?: 'allow' | 'deny' | 'ignore'; // How to treat dotfiles
}
