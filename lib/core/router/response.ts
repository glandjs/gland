import { ServerResponse, CookieOptions } from 'http';
const PROTO = ServerResponse.prototype;
PROTO.clearCookie = function (name: string): ServerResponse {
  if (!name) {
    throw new Error('Cookie name is required');
  }
  return this.cookie(name, '', { expires: new Date(0) });
};

PROTO.cookie = function (name: string, value: string, options: CookieOptions = {}): ServerResponse {
  if (!name || typeof name !== 'string') {
    throw new Error('Cookie name is required and must be a string');
  }

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.maxAge) {
    cookieString += `; Max-Age=${Math.floor(options.maxAge)}`;
  }

  if (options.expires) {
    cookieString += `; Expires=${options.expires.toUTCString()}`;
  }

  if (options.httpOnly) {
    cookieString += '; HttpOnly';
  }

  if (options.secure) {
    cookieString += '; Secure';
  }

  if (options.domain) {
    cookieString += `; Domain=${options.domain}`;
  }

  if (options.path) {
    cookieString += `; Path=${options.path}`;
  } else {
    cookieString += `; Path=/`;
  }

  if (options.sameSite) {
    cookieString += `; SameSite=${options.sameSite}`;
  }

  this.setHeader('Set-Cookie', cookieString);
  return this;
};
PROTO.redirect = function (url: string, statusCode: number = 302): void {
  if (typeof url !== 'string' || !url) {
    throw new Error('A valid URL is required for redirection');
  }

  if (typeof statusCode !== 'number' || statusCode < 300 || statusCode > 399) {
    throw new Error('Invalid status code for redirection');
  }

  this.writeHead(statusCode, { Location: url });
  this.end();
};