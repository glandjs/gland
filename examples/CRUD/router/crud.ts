import { exposed } from '../../../lib/core/decorators/exposed';
import { Delete, Get, Post, Put, Route } from '../../../lib/core/router';
import { Context } from '../../../lib/types/types';
import db from '../models/db.json';
import fs from 'fs';
import p from 'path';
const file = p.join(__dirname, '..', 'models', 'db.json');
@Route('/')
@exposed
class CRUD {
  @Get()
  get(ctx: Context) {
    const users = JSON.stringify(db);
    ctx.writeHead(200, {
      'Content-Length': Buffer.byteLength(users),
      'Content-Type': 'text/plain',
    });
    ctx.end(users);
  }
  @Post()
  post(ctx: Context) {
    const user = ctx.body
    console.log('use:', user);
  }
  @Delete()
  del(ctx: Context) {}
  @Put()
  put(ctx: Context) {}
}
