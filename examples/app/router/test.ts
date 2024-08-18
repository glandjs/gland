import { exposed } from '../../../lib/core/decorators/exposed';
import { Get, Route } from '../../../lib/core/router';
import { Context } from '../../../lib/types/types';
@exposed
@Route('/users')
class test {
  @Get()
  getAll(ctx: Context) {
    ctx.writeHead(200, { 'Content-Type': 'application/json' });
    ctx.end(JSON.stringify({ test: 1, id: '24' }));
  }
}

@exposed
@Route('/users/get')
class Users {
  @Get()
  get(ctx: Context) {
    ctx.writeHead(200, { 'Content-Type': 'application/json' });
    ctx.end(JSON.stringify({ users: 'sssss' }));
  }
}
