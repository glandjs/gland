import { WebServer } from '../../lib/core/server';
import { Context } from '../../lib/types/types';
const app = new WebServer();

// Define a dynamic route with `all` method
app.all('/about', async (ctx: Context) => {
  ctx.end('REQUEST ' + ctx.method + ctx.url);
});

// Start the server
app.init({
  port: 3000,
  host: '127.0.0.1',
  logger: true,
});
