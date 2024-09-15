import { expect } from 'chai';
import sinon from 'sinon';
import { WebServer } from '../../../lib/core/server'; // Adjust the path as necessary
import { METHODS } from 'http';
import { Parser } from '../../../lib/helper/Parser';
import { Router } from '../../../lib/core/router';
import { LoadModules } from '../../../lib/helper/load';
import { Context, Gland, NxtFunction } from '../../../lib/types';
import { midManager } from '../../../lib/core/middleware';
import { ServerUtils } from '../../../lib/helper';

describe('WebServer', () => {
  let server: WebServer;
  let lifecycleStub: sinon.SinonStub;
  let parserRequestStub: sinon.SinonStub;
  let routerFindMatchStub: sinon.SinonStub;
  let routerExecuteStub: sinon.SinonStub;
  let routerRunStub: sinon.SinonStub;
  let loadModulesLoadStub: sinon.SinonStub;
  let serverUtilsLogStub: sinon.SinonStub;

  beforeEach(() => {
    server = new WebServer();
    lifecycleStub = sinon.stub(server as any, 'lifecycle');
    parserRequestStub = sinon.stub(Parser, 'Request');
    routerFindMatchStub = sinon.stub(Router, 'findMatch');
    routerExecuteStub = sinon.stub(Router, 'execute');
    routerRunStub = sinon.stub(Router, 'run');
    loadModulesLoadStub = sinon.stub(LoadModules, 'load').resolves();
    serverUtilsLogStub = sinon.stub(ServerUtils.Tools, 'log');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('use()', () => {
    it('should register middleware and path handlers', () => {
      // Define middleware
      const middleware1: Gland.Middleware = (ctx: Context, next: NxtFunction) => {};
      const middleware2: Gland.Middleware = (ctx: Context, next: NxtFunction) => {};

      // Spy on midManager.process to check if it was called correctly
      const processSpy = sinon.spy(midManager, 'process');

      // Call use()
      server.use('/test', middleware1, middleware2);

      // Ensure process was called with the correct arguments
      expect(processSpy.calledOnceWith('/test', [middleware1, middleware2], server['middlewares'])).to.be.true;

      // Check that middlewares were added to the server
      const registeredMiddlewares = server['middlewares'];
      expect(registeredMiddlewares).to.have.length(2);
      // Create a mock context and next function
      const ctx: Context = { url: '/test', method: 'GET', json: async () => ({}) } as any;
      const next = sinon.stub().resolves();
      registeredMiddlewares.forEach(async (middleware) => {
        await middleware(ctx, '', next);
      });
      const spyMiddleware1 = sinon.spy(middleware1);
      const spyMiddleware2 = sinon.spy(middleware2);
      server.use('/test', spyMiddleware1, spyMiddleware2);
      const newRegisteredMiddlewares = server['middlewares'];
      newRegisteredMiddlewares.forEach(async (middleware) => {
        await middleware(ctx, '', next);
      });

      expect(spyMiddleware1.called).to.be.true;
      expect(spyMiddleware2.called).to.be.true;
    });
  });

  describe('all()', () => {
    it('should register handler for all HTTP methods', () => {
      const handler: Gland.RouteHandler = (ctx) => {};
      const routerSetSpy = sinon.spy(Router, 'set');
      server.all('/test', handler);
      METHODS.forEach((method) => {
        expect(routerSetSpy.calledWith(handler, '/test')).to.be.true;
      });
      const registeredMiddlewares = server['middlewares'];
      expect(registeredMiddlewares).to.have.length(METHODS.length);
      METHODS.forEach((method) => {
        const middlewareKey = `${method}:/test:${handler.toString()}`;
        const middleware = registeredMiddlewares.find((mw: any) => mw.key === middlewareKey);
        expect(middleware).to.exist;
      });
    });

    it('should not register duplicate handlers', () => {
      const handler: Gland.RouteHandler = (ctx: Context) => {};
      server.all('/test', handler);
      server.all('/test', handler);
      const registeredMiddlewares = server['middlewares'];
      expect(registeredMiddlewares).to.have.length(METHODS.length);
    });
  });
  describe('load()', () => {
    it('should call LoadModules.load with the correct path', async () => {
      await server.load();
      expect(loadModulesLoadStub.calledOnceWith('./*.ts')).to.be.true;
      loadModulesLoadStub.resetHistory();
      await server.load('./modules/*.ts');
      expect(loadModulesLoadStub.calledOnceWith('./modules/*.ts')).to.be.true;
    });
  });
});
