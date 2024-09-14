import { expect } from 'chai';
import sinon from 'sinon';
import { WebServer } from '../server'; // Adjust the path as necessary
import { METHODS } from 'http';
import { Parser } from '../../helper/Parser';
import { Router } from '../router';
import { LoadModules } from '../../helper/load';
import { Context, Gland, NxtFunction } from '../../types';
import { midManager } from '../middleware';
import { ServerUtils } from '../../helper/';

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

    // Stub lifecycle method if needed
    lifecycleStub = sinon.stub(server as any, 'lifecycle');

    // Stub Parser.Request
    parserRequestStub = sinon.stub(Parser, 'Request');

    // Stub Router methods
    routerFindMatchStub = sinon.stub(Router, 'findMatch');
    routerExecuteStub = sinon.stub(Router, 'execute');
    routerRunStub = sinon.stub(Router, 'run');

    // Stub LoadModules.load
    loadModulesLoadStub = sinon.stub(LoadModules, 'load').resolves();

    // Stub ServerUtils.Tools.log
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
      const routerSetSpy = sinon.spy(Router, 'set');
      server.all('/test', handler);
      server.all('/test', handler);
      METHODS.forEach((method) => {
        const setCallCount = routerSetSpy.withArgs(handler, '/test').callCount;
        expect(setCallCount).to.equal(35, `Expected Router.set to be called once for ${method}`);
      });
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
