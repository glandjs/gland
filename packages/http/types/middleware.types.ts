import { IncomingMessage, ServerResponse } from 'http';
import { HttpContext } from '../interface';
import { NextFunction } from '@gland/common';

export type ExpressLikeMiddleware = (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => void | Promise<void>;

export type GlandMiddleware = (ctx: HttpContext, next: NextFunction) => Promise<void> | void;

export type AnyMiddleware = ExpressLikeMiddleware | GlandMiddleware;
