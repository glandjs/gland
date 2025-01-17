import { MiddlewareFn } from '../../../../dist';

let requestCounts = new Map();

export const rateLimitMiddleware: MiddlewareFn = async (ctx, next) => {
  const ip = ctx.req.headers['x-forwarded-for'];
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const timestamps = requestCounts.get(ip);
  timestamps.push(now);

  // Keep only requests in the last 60 seconds
  requestCounts.set(
    ip,
    timestamps.filter((time: number) => now - time <= 60000),
  );

  if (timestamps.length > 10) {
    ctx.status = 429;
    ctx.send({ error: 'Too many requests' });
    return;
  }

  await next();
};
