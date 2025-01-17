import { MiddlewareFn, ServerRequest } from '../../../../dist';

export const validationMiddleware: MiddlewareFn = async (ctx: ServerRequest, next: Function) => {
  if (!ctx.body || !ctx.body.name) {
    ctx.status = 400;
    ctx.send({ error: 'Validation Error: Name is required' });
    return;
  }
  await next();
};
