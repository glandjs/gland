import { HttpContext } from 'node:http';

export type MiddlewareFn = (ctx: HttpContext, next: Function) => void;
