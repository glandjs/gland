import gland, { Context } from '../../dist';
const app = new gland();

// Define a dynamic route with `all` method
app.all('/about', async (ctx: Context) => {
  ctx.end('REQUEST ' + ctx.method + ctx.url);
});

(async () => {
  const db = app.Qiu('mariadb', 'mahdi', 'root');
  const result = await db.run('SHOW DATABASES;');
  console.log('result:', result);
})();

app.load('router');

// Start the server
app.init({
  port: 3000,
  host: '127.0.0.1',
  logger: true,
});
