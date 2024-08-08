import http, { Server } from 'http';
import { WebContext } from '../../lib/core/ctx/index';
import { assert } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { PassThrough } from 'stream';

describe('WebContext', () => {
  let server: Server, ctx: WebContext;
  let request: http.IncomingMessage, response: http.ServerResponse;

  beforeEach(() => {
    request = new PassThrough() as any;
    response = new PassThrough() as any;

    // Simulate a real HTTP request/response pair
    server = http.createServer((req, res) => {
      ctx = new WebContext(req, res);
    });

    server.emit('request', request, response);
  });

  it('should set a property on the request object', () => {
    ctx.ctx.customProp = 'testValue';
    assert.equal(ctx.ctx.customProp, 'testValue');
    assert.equal(ctx.ctx.customProp, 'testValue');
  });

  it('should get a property from the request object', () => {
    request.method = 'GET';
    assert.equal(ctx.ctx.method, 'GET');
  });

  it('should get a property from the response object', () => {
    ctx.ctx.statusCode = 404;
    assert.equal(ctx.ctx.statusCode, 404);
  });

  it('should check if a property exists on the request or response object', () => {
    assert.isFalse('method' in ctx.ctx);
    assert.isFalse('statusCode' in ctx.ctx);
    assert.isFalse('nonexistentProp' in ctx.ctx);
  });

  it('should delete a property from the request object', () => {
    ctx.ctx.customProp = 'toBeDeleted';
    assert.equal(ctx.ctx.customProp, 'toBeDeleted');
    delete ctx.ctx.customProp;
    assert.equal(ctx.ctx.customProp, undefined);
  });
});
