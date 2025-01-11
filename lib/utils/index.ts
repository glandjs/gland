import { ServerResponse } from 'http';
import { ServerRequest } from '../types';
import { AppConfig, KEY_SETTINGS } from '../common/interface/app-settings.interface';
import { HttpStatus } from '../common/enums/status.enum';

export function isClass(func: Function): boolean {
  return typeof func === 'function' && /^class\s/.test(Function.prototype.toString.call(func));
}
export function generateCacheKey(ctx: ServerRequest): string {
  return `${ctx.req.method}:${ctx.req.url}`;
}
export function generateETag(body: string): string {
  return require('crypto').createHash('sha256').update(body).digest('hex');
}
export async function handleETag(ctx: ServerRequest): Promise<void> {
  if (ctx.res.getHeader('etag')) {
    // Check if the client has sent an If-None-Match header with a matching ETag
    const clientEtag = ctx.req.headers['if-none-match'];
    const serverEtag = ctx.res.getHeader('etag');

    if (clientEtag && clientEtag === serverEtag) {
      ctx.res.statusCode = HttpStatus.NOT_MODIFIED; // Not Modified
      ctx.res.end(); // No need to send the response body
      return;
    }
  }
  const body = JSON.stringify(ctx.body);
  const etag = generateETag(body);
  ctx.res.setHeader('etag', etag);
}
export function setPoweredByHeader(res: ServerResponse, settings: AppConfig): void {
  const poweredBy = settings[KEY_SETTINGS.X_POWERED_BY] ?? true;

  if (poweredBy) {
    res.setHeader('X-Powered-By', 'Gland');
  } else {
    res.removeHeader('X-Powered-By');
  }
}
