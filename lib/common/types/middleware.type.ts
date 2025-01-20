import { ServerRequest } from '../interfaces';
export type NextFunction = () => void | Promise<void>;
export type MiddlewareFn = (ctx: ServerRequest, next: NextFunction) => void | Promise<void>;
