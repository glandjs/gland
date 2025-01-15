import { ServerRequest } from "../common/interfaces";

export function generateCacheKey(ctx: ServerRequest): string {
  return `${ctx.req.method}:${ctx.req.url}`;
}
