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
  export interface StaticOptions {
    dotfiles?: 'allow' | 'deny' | 'ignore';
    etag?: boolean;
    index?: string | boolean;
    maxAge?: number;
    redirect?: boolean;
    setHeaders?: (res: ServerResponse, path: string, stat: any) => void;
  }
  export interface APP {
    engine(ext: string, callback: Engine): this;
    all(path: string, ...handlers: RouteHandler[]): this;
    use(path: string | Middleware, ...handlers: Middleware[]): this;
    engine(ext: string, callback: Function): this;
    set(name: string, value?: any): this;
    get(name: string): any;
    static(root: string, options?: Gland.StaticOptions): this;
  }
  export interface Engine {
    (path: string, options: object, callback: (err: Error | null, rendered?: string) => void): void;
  }

  // Gland-style Middleware (ctx, next)
  export type GlandMiddleware = (ctx: Context, next: () => Promise<void>) => void | Promise<void>;

  // Express-style Middleware (req, res, next)
  export type ExpressMiddleware = (req: Context['req'], res: Context['res'], next: (err?: any) => void) => void | Promise<void>;

  // Combined Middleware type, allows both Gland and Express-style
  export type Middleware = GlandMiddleware | ExpressMiddleware;
  export type RouteHandler = (ctx: Context) => void | Promise<void>;
}
