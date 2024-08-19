export namespace Gland {
  import { RouteMethods } from './types';
  export interface ListenOptions {
    port?: number;
    host?: string;
    backlog?: number;
    path?: string;
    exclusive?: boolean;
    logger?: boolean;
  }
  export interface Listener {
    init(opts: ListenOptions): void;
  }

  export interface APP {
    engine(ext: string, callback: ViewEngineCallback): this;
    set(setting: string, value: any): this;
    all(path: string, ...handlers: RouteHandler[]): this;
    cors(options?: CorsOptions): this;
    use(path: string | Middleware, ...handlers: Middleware[]): this;
  }
  export type ViewEngineCallback = (path: string, options: object, callback: (err: Error | null, rendered?: string) => void) => void;
  export type Middleware = (ctx: Context, next: () => Promise<void>) => void;
  export type RouteHandler = (ctx: Context) => void;
  export interface CorsOptions {
    origin?: string | string[];
    methods?: string | string[];
    headers?: string | string[];
    credentials?: boolean;
    maxAge?: number;
  }
}
