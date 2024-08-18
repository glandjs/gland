import { g } from '../../lib/core/server';
import { Context } from '../../lib/types/types';
function log(ctx: Context, next: Function) {
  console.log(`Received ${ctx.method} request to ${ctx.url}:USE METHOD`);
  return next();
}
g.load('router');
g.use(log);
g.init({ logger: true, port: 3000, host: '127.0.0.1' });
