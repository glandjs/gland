import { GlobalCache } from '../../common/interface/app-settings.interface';
import { HttpContext } from '../../types';

/**
 * Cache decorator to enable caching for a route.
 * @param ttl - Time-to-live for the cached response in milliseconds.
 */
export function Cache(ttl?: number): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (ctx: HttpContext, ...args: any[]) {
      const cacheSystem: GlobalCache = ctx.cache;
      const cacheKey = `${ctx.req.method}:${ctx.req.url}`;
      console.log('KEYS:', cacheSystem.keys());
      console.log('KEYS:cacheKey', cacheSystem.has(cacheKey));
      console.log('cacheKey', cacheKey);

      // Check if the response is cached
      if (cacheSystem.has(cacheKey)) {
        const cachedResponse = cacheSystem.get(cacheKey);
        console.log('cachedResponse', cachedResponse);

        return cachedResponse;
      }

      // Call the original method to handle the request
      const result = await originalMethod.apply(this, [ctx, ...args]);
      console.log('result', result);
      console.log('ctx.res.statusCode', ctx.res.statusCode);
      console.log('ctx.statusCode', ctx.statusCode);
      // Cache the response
      if (ctx.res.statusCode === 200) {
        cacheSystem.set(cacheKey, result, {
          ttl: ttl,
        });
      }

      return result;
    };

    return descriptor;
  };
}
