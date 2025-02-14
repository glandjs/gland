import { Primitive } from '@gland/common';
import { CtxKeys } from '../enums';
export type CtxKey = `${(typeof CtxKeys)[keyof typeof CtxKeys]}`;
export type CtxVal<T = unknown> = T | Primitive | object | Array<CtxVal> | Map<CtxVal, CtxVal> | Set<CtxVal>;
