import { ServerRequest } from '../interfaces';

export type MiddlewareFn = (ctx: ServerRequest, next: Function) => void | Promise<void>;
