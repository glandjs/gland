import { Application } from './core/Application';
import { Get } from './router/decorator/http';
import { Controller } from './router/decorator/Controller';
import { MiddlewareFn } from './common/interface/middleware.interface';
import { MultiLang } from './router/decorator/MultiLang';
import { HttpContext } from './types';
import { Transform } from './router/decorator/Transform';
import { Guard } from './router/decorator/Guards';
import { Cache } from './router/decorator/Cache';
const loggerMiddleware: MiddlewareFn = async (ctx, next) => {
  console.log('Route-specific Middleware');
  await next();
};
const globalLogger: MiddlewareFn = async (ctx, next) => {
  console.log('Global MIddleware');
  await next();
};
function Auth(ctx: HttpContext) {
  console.log('Hello Guard');
  ctx.res.writeHead(200, { 'Content-Type': 'text/plain' });
  ctx.res.end(`End From Guard`);
}
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
  @Guard(Auth)
  @Cache(30)
  getUserById(ctx: HttpContext) {
    const { id } = ctx.params;
    console.log('typeof id', typeof id);
    console.log('id', id);
    ctx.res.writeHead(200, { 'Content-Type': 'text/plain' });
    ctx.res.end(`User ID is: ${id}`);
  }
}
const app = new Application();
app.use(globalLogger); // not work
app.register([UsersController]);
app.listen();
