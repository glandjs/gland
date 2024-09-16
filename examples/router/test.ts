import { Context, Get, Route } from '../../dist';

@Route('/test')
export class Test {
  @Get()
  test(ctx: Context) {
    ctx.write('hello world2222');
    ctx.end();
  }
}
