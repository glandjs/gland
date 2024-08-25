import gland, { Context, NxtFunction } from 'glands';
const g = new gland();
async function log(ctx: Context, nxt: NxtFunction) {
  console.log('Hello World');
  await nxt();
}
g.use(log);
g.use('/', (ctx: Context) => {
  ctx.end('hello World');
});
g.init({ host: 'localhost', port: 3000, logger: true });
