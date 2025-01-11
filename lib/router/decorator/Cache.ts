import { GlobalCache } from '../../common/interface/app-settings.interface';
import { ServerRequest } from '../../types';
import { generateCacheKey } from '../../utils';

/**
 * Cache decorator to enable caching for a route.
 * @param ttl - Time-to-live for the cached response in milliseconds.
 */
export function Cache(ttl?: number): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (ctx: ServerRequest, ...args: any[]) {
      const cacheSystem: GlobalCache = ctx.cache;
      const cacheKey = generateCacheKey(ctx);
      if (cacheSystem.has(cacheKey)) {
        const cachedResponse = cacheSystem.get(cacheKey);
        ctx.res.writeHead(cachedResponse.statusCode, cachedResponse.headers);
        ctx.res.end(cachedResponse.body);
        return cachedResponse.body;
      }
      // Cache miss - Call the original method to handle the request
      const result = await originalMethod.apply(this, [ctx, ...args]);
      if (result) {
        const cachedResponse = {
          body: result,
          statusCode: ctx.res.statusCode,
          headers: ctx.res.getHeaders(),
        };
        if (ctx.res.statusCode === 200) {
          cacheSystem.set(cacheKey, cachedResponse, { ttl });
        }
      }
      return result;
    };

    return descriptor;
  };
}
