import { mid, mids } from '../lib/core/decorators/mid';
import { Delete, Get, Post, Put, Route } from '../lib/core/router';
import { g } from '../lib/core/server';
import { Context } from '../lib/types/types';

function logMiddleware(ctx: Context) {
  console.log(`Received ${ctx.method} request to ${ctx.url}:GLOBAL`);
}

function authenticate(ctx: Context) {
  if (!ctx.headers['authorization']) {
    ctx.writeHead(401, { 'Content-Type': 'application/json' });
    ctx.end(JSON.stringify({ message: 'Unauthorized' }));
    return false;
  }
  ctx.user = { id: 1, role: 'admin' };
  return true;
}

function validateUser(ctx: Context) {
  const body = ctx.body;
  if (!body) {
    return false;
  }
  if (!body.name || typeof body.name !== 'string') {
    ctx.writeHead(400, { 'Content-Type': 'application/json' });
    ctx.end(JSON.stringify({ message: 'Invalid user data' }));
    return false;
  }
  return true;
}

function errorHandler(ctx: Context, error: Error) {
  console.error(error);
  ctx.writeHead(500, { 'Content-Type': 'application/json' });
  ctx.end(JSON.stringify({ message: 'Internal Server Error' }));
}

let users: any = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' },
];

@mids([logMiddleware, authenticate])
@Route('/users')
class UserController {
  // Create a new user with validation
  @mid(validateUser)
  @Post()
  async create(ctx: Context) {
    try {
      const body = ctx.body;
      const newUser = { id: users.length + 1, ...body };
      users.push(newUser);
      ctx.writeHead(201, { 'Content-Type': 'application/json' });
      ctx.end(JSON.stringify(newUser));
    } catch (error: any) {
      errorHandler(ctx, error);
    }
  }

  // Read all users with optional query filters
  @Get()
  getAll(ctx: Context) {
    let result = users;
    if (ctx.query?.role) {
      result = users.filter((u: any) => u.role === ctx.query.role);
    }
    ctx.writeHead(200, { 'Content-Type': 'application/json' });
    ctx.end(JSON.stringify(result));
  }

  // Read a single user by ID
  @Get('/:id')
  getOne(ctx: Context) {
    const id = parseInt(ctx.params.id, 10);
    const user = users.find((u: any) => u.id === id);
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
  async update(ctx: Context) {
    try {
      const id = parseInt(ctx.params.id, 10);
      const updatedData = ctx.body;
      console.log('updatedData:', updatedData);

      let user = users.find((u: any) => u.id === id);
      if (user) {
        user = { ...user, ...updatedData };
        users = users.map((u: any) => (u.id === id ? user : u));
        ctx.writeHead(200, { 'Content-Type': 'application/json' });
        ctx.end(JSON.stringify(user));
      } else {
        ctx.writeHead(404, { 'Content-Type': 'application/json' });
        ctx.end(JSON.stringify({ message: 'User not found' }));
      }
    } catch (error: any) {
      errorHandler(ctx, error);
    }
  }

  // Delete a user by ID with authentication check
  @mid((ctx: Context) => ctx.user.role === 'admin') // Only admin can delete
  @Delete('/:id')
  delete(ctx: Context) {
    const id = parseInt(ctx.params.id, 10);
    users = users.filter((u: any) => u.id !== id);
    ctx.writeHead(204); // No Content
    ctx.end();
  }
}

@Route('/posts')
class PostController {
  private posts: any = [
    { id: 1, title: 'First Post', content: 'This is the first post' },
    { id: 2, title: 'Second Post', content: 'This is the second post' },
  ];

  // Create a new post
  @Post()
  async create(ctx: Context) {
    try {
      const body = ctx.body;
      const newPost = { id: this.posts.length + 1, ...body };
      this.posts.push(newPost);
      ctx.writeHead(201, { 'Content-Type': 'application/json' });
      ctx.end(JSON.stringify(newPost));
    } catch (error: any) {
      errorHandler(ctx, error);
    }
  }

  // Get all posts with pagination
  @Get()
  getAll(ctx: Context) {
    const page = parseInt(ctx.query.page || '1', 10);
    const limit = parseInt(ctx.query.limit || '10', 10);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = this.posts.slice(startIndex, endIndex);

    ctx.writeHead(200, { 'Content-Type': 'application/json' });
    ctx.end(JSON.stringify({ page, limit, data: paginatedPosts }));
  }

  // Get a single post by ID
  @Get('/:id')
  getOne(ctx: Context) {
    const id = parseInt(ctx.params.id, 10);
    const post = this.posts.find((p: any) => p.id === id);
    if (post) {
      ctx.writeHead(200, { 'Content-Type': 'application/json' });
      ctx.end(JSON.stringify(post));
    } else {
      ctx.writeHead(404, { 'Content-Type': 'application/json' });
      ctx.end(JSON.stringify({ message: 'Post not found' }));
    }
  }

  // Update a post by ID
  @Put('/:id')
  async update(ctx: Context) {
    try {
      const id = parseInt(ctx.params.id, 10);
      const updatedData = ctx.body;
      let post = this.posts.find((p: any) => p.id === id);
      if (post) {
        post = { ...post, ...updatedData };
        this.posts = this.posts.map((p: any) => (p.id === id ? post : p));
        ctx.writeHead(200, { 'Content-Type': 'application/json' });
        ctx.end(JSON.stringify(post));
      } else {
        ctx.writeHead(404, { 'Content-Type': 'application/json' });
        ctx.end(JSON.stringify({ message: 'Post not found' }));
      }
    } catch (error: any) {
      errorHandler(ctx, error);
    }
  }

  // Delete a post by ID
  @Delete('/:id')
  delete(ctx: Context) {
    const id = parseInt(ctx.params.id, 10);
    this.posts = this.posts.filter((p: any) => p.id !== id);
    ctx.writeHead(204); // No Content
    ctx.end();
  }
}

// Initialize the server
g.init({ port: 3000, host: 'localhost', logger: true });
