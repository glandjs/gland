import { afterEach, beforeEach, describe, it } from 'mocha';
import { Router } from '../../../dist/router/Router';
import sinon from 'sinon';
import { expect } from 'chai';
import { EventSystem } from '../../../dist/events/EventSystem';
import { RouteDefinition, ServerRequest } from '../../../dist/common/interfaces';
import Reflector from '../../../dist/metadata';
import { HttpStatus } from '../../../dist/common/enums';
import { MiddlewareFn } from '../../../dist/common/types';
import { ContextFactory } from '../../../dist/context/context-factory';
import { ActionHandler } from '../../../dist/utils';

describe('Router', () => {
  let router: Router;
  let mockEvents: sinon.SinonStubbedInstance<EventSystem>;
  let mockReflector: sinon.SinonStubbedInstance<typeof Reflector>;

  beforeEach(() => {
    mockEvents = sinon.createStubInstance(EventSystem);

    mockReflector = {
      getRoutes: sinon.stub(),
      get: sinon.stub(),
      update: sinon.stub(),
    } as any;

    // Override Reflector with the stubbed version
    Reflector.getRoutes = mockReflector.getRoutes;
    Reflector.get = mockReflector.get;
    Reflector.update = mockReflector.update;
    router = new Router('', mockEvents);
  });
  afterEach(() => {
    sinon.restore();
  });
  describe('findMatch()', () => {
    it('should return matched route based on method and path', () => {
      const ctx: ServerRequest = {
        req: { method: 'GET', url: '/api/test' } as any,
        res: {} as any,
        status: HttpStatus.OK,
        language: 'en',
        params: {},
        query: {},
        server: {} as any,
        body: null,
        bodySize: 0,
        bodyRaw: Buffer.from(''),
        clientIp: '127.0.0.1',
        error: null,
        cache: null as any,
        redirect: sinon.stub(),
        send: sinon.stub(),
        settings: sinon.stub(),
      };

      const route: RouteDefinition = {
        method: 'GET',
        path: '/api/test',
        constructor: class Test {},
        action: sinon.stub(),
        params: {},
        query: {},
        middlewares: [sinon.stub() as MiddlewareFn],
      };
      route.middlewares!.push(sinon.stub() as MiddlewareFn);
      mockReflector.getRoutes.returns([route]);
      const matchedRoute = router.findMatch(ctx);

      expect(matchedRoute).to.deep.equal(route);
    });

    it('should return null if no route is matched', () => {
      const ctx: ServerRequest = {
        req: { method: 'POST', url: '/api/unknown' } as any,
        res: {} as any,
        status: HttpStatus.OK,
        language: 'en',
        params: {},
        query: {},
        server: {} as any,
        body: null,
        bodySize: 0,
        bodyRaw: Buffer.from(''),
        clientIp: '127.0.0.1',
        error: null,
        cache: null as any,
        redirect: sinon.stub(),
        send: sinon.stub(),
        settings: sinon.stub(),
      };
      const route: RouteDefinition = { method: 'GET', path: '/api/test', constructor: class Test {}, action: sinon.stub(), params: {}, query: {}, middlewares: [sinon.stub() as MiddlewareFn] };
      mockReflector.getRoutes.returns([route]);

      const matchedRoute = router.findMatch(ctx);
      expect(matchedRoute).to.be.null;
    });
    it('should return null if no routes match', () => {
      mockReflector.getRoutes.returns([]);

      const ctx: ServerRequest = {
        req: { url: '/nonexistent', method: 'GET' } as any,
        res: {} as any,
        status: HttpStatus.OK,
        language: 'en',
        params: {},
        query: {},
        server: {} as any,
        body: null,
        bodySize: 0,
        bodyRaw: Buffer.from(''),
        clientIp: '127.0.0.1',
        error: null,
        cache: null as any,
        redirect: sinon.stub(),
        send: sinon.stub(),
        settings: sinon.stub(),
      };

      const result = router.findMatch(ctx);
      expect(result).to.be.null;
    });

    it('should return the matching route', () => {
      const routes: RouteDefinition[] = [{ method: 'GET', path: '/test', constructor: {}, middlewares: [], action: sinon.stub(), params: {}, query: {} }];
      mockReflector.getRoutes.returns(routes);

      const ctx: ServerRequest = {
        req: { url: '/test', method: 'GET' } as any,
        res: {} as any,
        status: HttpStatus.OK,
        language: 'en',
        params: {},
        query: {},
        server: {} as any,
        body: null,
        bodySize: 0,
        bodyRaw: Buffer.from(''),
        clientIp: '127.0.0.1',
        error: null,
        cache: null as any,
        redirect: sinon.stub(),
        send: sinon.stub(),
        settings: sinon.stub(),
      };

      const result = router.findMatch(ctx);
      expect(result).to.deep.equal(routes[0]);
    });

    it('should handle multi-language routes', () => {
      const routes: RouteDefinition[] = [{ method: 'GET', path: '/test', constructor: {}, middlewares: [], action: sinon.stub(), params: {}, query: {} }];
      const translations = { en: '/test', fr: '/essai', default: '/test' };

      mockReflector.getRoutes.returns(routes);
      mockReflector.get.returns(translations);

      const ctx: ServerRequest = {
        req: { url: '/test', method: 'GET', headers: { 'accept-language': 'en' } } as any,
        res: {} as any,
        language: 'en',
        status: HttpStatus.OK,
        params: {},
        query: {},
        server: {} as any,
        body: null,
        bodySize: 0,
        bodyRaw: Buffer.from(''),
        clientIp: '127.0.0.1',
        error: null,
        cache: null as any,
        redirect: sinon.stub(),
        send: sinon.stub(),
        settings: sinon.stub(),
      };

      const result = router.findMatch(ctx);
      expect(result?.path).to.equal('/test');

      const ctx_fr: ServerRequest = {
        ...ctx,
        language: 'fr',
        req: { url: '/essai', method: 'GET', headers: { 'accept-language': 'fr' } } as any,
      };
      const result_fr = router.findMatch(ctx_fr);
      expect(result_fr?.path).to.equal('/essai');

      const ctx_default: ServerRequest = {
        ...ctx,
        language: 'es',
        req: { url: '/test', method: 'GET', headers: { 'accept-language': 'es' } } as any,
      };
      const result_default = router.findMatch(ctx_default);
      expect(result_default?.path).to.equal('/test');
    });
  });
  describe('run()', () => {
    let mockCtx: ServerRequest;
    let mockActionHandler: sinon.SinonStubbedInstance<ActionHandler>;
    let sendSpy: sinon.SinonSpy;
    beforeEach(() => {
      mockActionHandler = {
        wrappedAction: sinon.stub(),
      } as unknown as sinon.SinonStubbedInstance<ActionHandler>;

      mockCtx = {
        req: { method: 'GET', url: '/api/test', socket: { remoteAddress: '127.0.0.1' } } as any,
        res: { statusCode: 200, end: sinon.spy() } as any,
        status: HttpStatus.OK,
        language: 'en',
        params: {},
        query: {},
        server: {} as any,
        body: null,
        bodySize: 0,
        bodyRaw: Buffer.from(''),
        clientIp: '127.0.0.1',
        error: null,
        cache: null as any,
        redirect: sinon.stub(),
        send: sinon.spy(),
        settings: sinon.stub(),
      };

      sendSpy = mockCtx.send as sinon.SinonSpy;

      sinon.stub(ContextFactory, 'createRouteContext').returns({ statusCode: HttpStatus.OK, ctx: mockCtx });
    });
    it('should return 304 if the response is fresh', async () => {
      const route: RouteDefinition = {
        method: 'GET',
        path: '/api/test',
        constructor: class Test {},
        middlewares: [],
        params: {},
        query: {},
        action: sinon.stub(),
      };

      mockReflector.getRoutes.returns([route]);
      mockCtx.res.statusCode = 304;

      // Run the router
      await router.run(mockCtx);

      // Assert the correct call to send with the expected response
      sinon.assert.calledWith(sendSpy, {
        statusCode: HttpStatus.NOT_MODIFIED,
        message: 'Not Modified',
        data: null,
      });
    });

    it('should handle errors and return 500', async () => {
      const route: RouteDefinition = {
        method: 'GET',
        path: '/api/test',
        constructor: class Test {},
        middlewares: [],
        params: {},
        query: {},
        action: sinon.stub(),
      };

      mockReflector.getRoutes.returns([route]);
      mockCtx.error = new Error('Test error');
      await router.run(mockCtx);
      sinon.assert.calledWith(sendSpy, {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        error: mockCtx.error,
      });
    });

    it('should handle 304 Not Modified', async () => {
      mockCtx.res.statusCode = 304;
      const route: RouteDefinition = {
        method: 'GET',
        path: '/api/test',
        constructor: class Test {},
        middlewares: [],
        params: {},
        query: {},
        action: sinon.stub(),
      };
      mockReflector.getRoutes.returns([route]);
      await router.run(mockCtx);
      sinon.assert.calledWith(sendSpy, {
        statusCode: HttpStatus.NOT_MODIFIED,
        message: 'Not Modified',
        data: null,
      });
    });
  });
});
