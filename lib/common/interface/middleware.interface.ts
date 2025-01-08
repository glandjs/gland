import { HttpContext } from "../../types";

export type MiddlewareFn = (ctx: HttpContext, next: Function) => void;
