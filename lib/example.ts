import { MiddlewareFn } from './middleware/Middleware.interface';
import { Application } from './core/Application';
import { Get } from './router/decorator/HttpMethods';
import { HttpContext } from 'node:http';
import { Controller } from './router/decorator/Controller';
const loggerMiddleware: MiddlewareFn = async (ctx, next) => {
  console.log(`METHOD:${ctx.method} URL:${ctx.url}`);
  await next();
};
@Controller('/')
class MyController {
  @Get('/', [loggerMiddleware])
  home(ctx: HttpContext) {
    ctx.writeHead(200, { 'Content-Type': 'text/plain' });
    ctx.end('Welcome to the Home Page!');
  }
}
const app = new Application({
  port: 3000,
  watch: true,
  hostname: 'localhost',
});
app.registerControllers([MyController]);
app.listen();
