import { mid, mids } from '../../../lib/core/decorators/mid';
import { Gmid } from '../../../lib/core/middleware';
import { Get, Post, Route } from '../../../lib/core/router';
import { exposed } from '../../../lib/helper/exposed';
import { Context } from '../../../lib/types/types';
import { authenticate, logMiddleware, logs, users, validateUser } from '../controller';
Gmid.set(logs);
@mids([logMiddleware, authenticate])
@exposed
@Route('/')
class UserController {
  @mid(validateUser)
  @Post()
  async create(ctx: Context) {
    const body = ctx.body;
    const newUser = { id: users.length + 1, ...body };
    users.push(newUser);
    ctx.writeHead(201, { 'Content-Type': 'application/json' });
    ctx.end(JSON.stringify(newUser));
  }

  @Get()
  getAll(ctx: Context) {
    let result = users;
    if (ctx.query?.role) {
      result = users.filter((u: any) => u.role === ctx.query.role);
    }
    ctx.writeHead(200, { 'Content-Type': 'application/json' });
    ctx.end(JSON.stringify(result));
  }
}


