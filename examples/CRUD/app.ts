import { WebServer } from '../../lib/core/server';
import { Context } from '../../lib/types/types';
import ejs from 'ejs';
const app = new WebServer();

// Configure the template engine
app.engine('.ejs', async (path: string, options: object, callback: (err: Error | null, rendered?: string) => void) => {
  ejs.renderFile(path, options, callback);
});

// Set default view engine and views directory
app.set('view engine', '.ejs');
app.set('views', './views');

app.use(async (ctx: Context, nxt: Function) => {
  console.log('hello from mid');
  await nxt();
});
// // Define routes
app.use('/api', async (ctx: any, next: () => Promise<void>) => {
  // Example middleware for API routes
  console.log('API route accessed');
  await next();
});

// Define a route with `all` method
app.all('/about', async (ctx: Context) => {
  ctx.render('index');
});

// Start the server
app.init({
  port: 3000,
  host: 'localhost',
  logger: true,
});
