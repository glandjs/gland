import { IncomingMessage, ServerResponse } from 'http';
import { WebContext } from '../core/context';
export namespace Gland {
  export interface ListenOptions {
    port?: number;
    host?: string;
    backlog?: number;
    path?: string;
    exclusive?: boolean;
    logger?: boolean;
  }
  export interface StaticOptions {
    dotfiles?: 'allow' | 'deny' | 'ignore';
    etag?: boolean;
    index?: string | boolean;
    maxAge?: number;
    redirect?: boolean;
    setHeaders?: (res: ServerResponse, path: string, stat: any) => void;
  }
  export interface APP {
    all(path: string, ...handlers: RouteHandler[]): this;
    use(path: string | Middleware, ...handlers: Middleware[]): this;
  }
  export interface Engine {
    (path: string, options: object, callback: (err: Error | null, rendered?: string) => void): void;
  }

  // Gland-style Middleware (ctx, next)
  export type GlandMiddleware = (ctx: Context, next: NxtFunction) => void | Promise<void>;

  // Express-style Middleware (req, res, next)
  export type ExpressMiddleware = (req: Context['req'], res: Context['res'], next: (err?: any) => void) => void | Promise<void>;

  // Combined Middleware type, allows both Gland and Express-style
  export type Middleware = GlandMiddleware | ExpressMiddleware;
  export type RouteHandler = (ctx: Context) => void | Promise<void>;
}

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
export type MidsFn = (ctx: Context, next: NxtFunction) => any;
export type RouteHandler = new (...args: any[]) => any | ((...args: any[]) => any);
export type DbTypes = 'mariadb' | 'postgres' | 'sqlite' | 'sqlserver' | 'mysql';
export type NxtFunction = () => Promise<void>;
export type ListenArgs =
  | [port?: number, hostname?: string, backlog?: number, listeningListener?: () => void]
  | [port?: number, hostname?: string, listeningListener?: () => void]
  | [port?: number, backlog?: number, listeningListener?: () => void]
  | [port?: number, listeningListener?: () => void]
  | [path: string, backlog?: number, listeningListener?: () => void]
  | [path: string, listeningListener?: () => void]
  | [options: Gland.ListenOptions, listeningListener?: () => void];
export interface ModuleConfig {
  path: string;
  recursive?: boolean;
  pattern?: string;
  cacheModules?: boolean;
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
}
