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
    cors(options?: any): this;
    use(path: string | Middleware, ...handlers: Middleware[]): this;
  }
  export type Middleware = (ctx: Context, next: () => Promise<void>) => void;
}
