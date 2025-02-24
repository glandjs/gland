import { Context } from './application';
import { Constructor } from './constructor.interface';
import { IncomingMessage, ServerResponse } from 'http';
export type NextFunction = () => Promise<void>;

export interface Middleware<T extends void = void> {
  use(ctx: Context, next: () => NextFunction): Promise<T> | T;
}

export type MiddlewareFunction = (ctx: Context, next: NextFunction) => Promise<void> | void;
export interface MiddlewareConfiguration {
  forRoutes?: (string | Constructor<any>)[];
  excludeRoutes?: string[];
}

export type ExpressStyleMiddleware = (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => void | Promise<void>;
export type AnyMiddleware = ExpressStyleMiddleware | MiddlewareFunction;
