import { MiddlewareFn } from '../../../../dist';

export const authMiddleware: MiddlewareFn = async (ctx, next) => {
  console.log('AUTH MID');
  await next();
};
