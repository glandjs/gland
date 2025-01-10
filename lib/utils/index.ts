import { RouterUtils } from '../common/constants';

export function isClass(func: Function): boolean {
  return typeof func === 'function' && /^class\s/.test(Function.prototype.toString.call(func));
}
export function generateCacheKey(ctx: any): string {
  // Extract the HTTP method and URL
  const method = ctx.method.toUpperCase();
  let url = ctx.url;

  // Replace dynamic route parameters with their values
  url = url.replace(RouterUtils.PARAMETER, (_: any, param: string) => {
    // Get the value for each dynamic route parameter from `ctx.params`
    return ctx.params[param] || '';
  });

  // Include query parameters if available
  let queryParams = '';
  if (ctx.query && Object.keys(ctx.query).length > 0) {
    queryParams = '?' + new URLSearchParams(ctx.query).toString();
  }

  // Generate the final cache key
  const cacheKey = `${method}:${url}${queryParams}`;
  return cacheKey;
}
