export namespace Gland {
    import { RouteMethods } from './types';
    export interface ListenOptions  {
        port?: number;
        host?: string;
        backlog?: number;
        path?: string;
        exclusive?: boolean;
        logger?:boolean
    }
    export interface Listener {
        init(opts: ListenOptions): void;
    }
}