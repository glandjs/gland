import { Application } from './core/Application';
import { Get, Post } from './router/decorator/http';
import { Controller } from './router/decorator/Controller';
import { MiddlewareFn } from './common/interface/middleware.interface';
import { MultiLang } from './router/decorator/MultiLang';
import { HttpContext } from './types';
const loggerMiddleware: MiddlewareFn = async (ctx, next) => {
  console.log(`METHOD:${ctx.method} URL:${ctx.url}`);
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
  getUserById(ctx: HttpContext) {
    const { id } = ctx.params;
    if (isNaN(Number(id))) {
      ctx.writeHead(400, { 'Content-Type': 'text/plain' });
      ctx.end('Invalid user ID');
      return;
    }

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
app.register([UsersController]);
app.listen();
