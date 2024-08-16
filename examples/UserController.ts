import { mid, mids } from '../lib/core/decorators/mid';
import { Delete, Get, Post, Put, Route } from '../lib/core/router/index';
import { Context } from '../lib/types/types';
import { g } from '../lib/core/server';

function logMiddleware(ctx: Context) {
  console.log(`Received ${ctx.method} request to ${ctx.url}:GLOBAL`);
}
function logArray(ctx: Context) {
  console.log(`logArray ${ctx.method} request to ${ctx.url}:GLOBAL`);
}
function logArray2(ctx: Context) {
  console.log(`logArray2 ${ctx.method} request to ${ctx.url}:GLOBAL`);
}
function log(ctx: Context) {
  console.log(`Received ${ctx.method} request to ${ctx.url}:JUST GET /users`);
}
let users: Array<{ id: number; name: string }> = [];
@mids([logMiddleware,logArray,logArray2])
@Route('/users')
class UserController {
  // Create a new user
  @mid(log)
  @Post()
  create(ctx: Context) {
    console.log(`Received a POST request to ${ctx.url} to create a new user`);

    let body = '';
    ctx.on('data', (chunk) => (body += chunk));
    ctx.on('end', () => {
      const user = JSON.parse(body);
      user.id = users.length + 1;
      users.push(user);
      ctx.writeHead(201, { 'Content-Type': 'application/json' });
      ctx.end(JSON.stringify(user));
    });
  }

  // Read all users
  @Get()
  getAll(ctx: Context) {
    console.log(`Received a GET With GetAll`);
    ctx.writeHead(200, { 'Content-Type': 'application/json' });
    ctx.end(JSON.stringify(users));
  }

  // Read a single user by ID
  @Get('/:id')
  getOne(ctx: Context) {
    console.log(`Received a GET With getOne`);
    const id = parseInt(ctx.params.id, 10);
    const user = users.find((u) => u.id === id);
    if (user) {
      ctx.writeHead(200, { 'Content-Type': 'application/json' });
      ctx.end(JSON.stringify(user));
    } else {
      ctx.writeHead(404, { 'Content-Type': 'application/json' });
      ctx.end(JSON.stringify({ message: 'User not found' }));
    }
  }

  // Update a user by ID
  @Put('/:id')
  update(ctx: Context) {
    const id = parseInt(ctx.params.id, 10);
    let body = '';
    ctx.on('data', (chunk) => (body += chunk));
    ctx.on('end', () => {
      const updatedData = JSON.parse(body);
      let user = users.find((u) => u.id === id);
      if (user) {
        user = { ...user, ...updatedData };
        console.log('user:', user);

        ctx.writeHead(200, { 'Content-Type': 'application/json' });
        ctx.end(JSON.stringify(user));
      } else {
        ctx.writeHead(404, { 'Content-Type': 'application/json' });
        ctx.end(JSON.stringify({ message: 'User not found' }));
      }
    });
  }

  // Delete a user by ID
  @Delete('/:id')
  delete(ctx: Context) {
    const id = parseInt(ctx.params.id, 10);
    users = users.filter((u) => u.id !== id);
    ctx.writeHead(204); // No Content
    ctx.end();
  }
}

g.init({ port: 3000, host: 'localhost', logger: true });
