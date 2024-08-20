import { exposed } from '../../../lib/core/decorators/exposed';
import { Delete, Get, Post, Put, Route } from '../../../lib/core/router';
import { Context } from '../../../lib/types/types';
import db from '../models/db.json';
@Route('/')
@exposed
class GetAllUser {
  @Get()
  get(ctx: Context) {
    const users = JSON.stringify(db);
    ctx.write(users);
    ctx.end();
  }
  @Post()
  post(ctx: Context) {}
  @Delete()
  del(ctx: Context) {}
  @Put()
  put(ctx: Context) {}
}
