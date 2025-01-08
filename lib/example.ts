import { Application } from './core/Application';
import { Get } from './router/decorator/http';
import { Controller } from './router/decorator/Controller';
import { MiddlewareFn } from './common/interface/middleware.interface';
import { MultiLang } from './router/decorator/MultiLang';
import { HttpContext } from './types';
import { Transform } from './router/decorator/Transform';
const loggerMiddleware: MiddlewareFn = async (ctx, next) => {
  console.log(`METHOD:${ctx.method} URL:${ctx.url}`);
  await next();
};
const globalLogger: MiddlewareFn = async (ctx, next) => {
  console.log(`Request Method: ${ctx.method}, Request URL: ${ctx.url}`);
  await next();
};
@Controller('/users')
class UsersController {
  @Get('/:id', [loggerMiddleware])
  @MultiLang({
    en: '/users/:id',
    fr: '/utilisateurs/:id',
    es: '/usuarios/:id',
  })
  @Transform((ctx) => {
    if (ctx.params.id) {
      console.log('ctx.params.id', ctx.params.id);
      ctx.params.id = +ctx.params.id;
      console.log('ctx.params.id', ctx.params.id);
    }
  })
  getUserById(ctx: HttpContext) {
    const { id } = ctx.params;
    console.log('typeof id', typeof id);
    console.log('id', id);
    ctx.writeHead(200, { 'Content-Type': 'text/plain' });
    ctx.end(`User ID is: ${id}`);
  }
}
const app = new Application({
  server: {
    port: 3000,
    hostname: 'localhost',
    watch: true,
  },
});
app.use(globalLogger); // not work
app.register([UsersController]);
app.listen();
