import { ServerRequest } from '../../types';

export type MiddlewareFn = (ctx: ServerRequest, next: Function) => void;
