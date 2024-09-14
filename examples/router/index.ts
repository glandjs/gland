import { Context, Get, Route } from '../../dist';

@Route('/')
export class Test {
  @Get()
  test(ctx: Context) {
    ctx.write('hello world');
    ctx.end();
  }
}
