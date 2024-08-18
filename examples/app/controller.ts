import { Context } from '../../lib/types/types';

export function logs(ctx: Context, next: Function) {
  console.log(`GMID GLOBAL MIDDLEWARE`);
  return next();
}
// Global Middleware
export function logMiddleware(ctx: Context, next: Function) {
  console.log(`Received ${ctx.method} request to ${ctx.url}:GLOBAL`);
  console.log('next:', next);

  return next();
}

export function authenticate(ctx: Context, next: Function) {
  if (!ctx.headers['authorization']) {
    ctx.writeHead(401, { 'Content-Type': 'application/json' });
    ctx.end(JSON.stringify({ message: 'Unauthorized' }));
    return;
  }
  ctx.user = { id: 1, role: 'admin' };
  return next();
}

export function validateUser(ctx: Context, next: Function) {
  const body = ctx.body;
  if (!body || !body.name || typeof body.name !== 'string') {
    ctx.writeHead(400, { 'Content-Type': 'application/json' });
    ctx.end(JSON.stringify({ message: 'Invalid user data' }));
    return;
  }
  return next();
}
// Sample data
export let users: any[] = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' },
];
