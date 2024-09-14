import { expect } from 'chai';
import * as sinon from 'sinon';
import { mid, mids, Route, getEx } from '../decorators';
import { ServerUtils } from '../../helper';
import Reflect from '../../metadata';
import { routes } from '../router';

describe('Decorators', () => {
  let reflectInitStub: sinon.SinonStub;
  let serverUtilsNormalizeStub: sinon.SinonStub;

  beforeEach(() => {
    reflectInitStub = sinon.stub(Reflect, 'init');
    serverUtilsNormalizeStub = sinon.stub(ServerUtils, 'normalize').callsFake((middleware: any) => (Array.isArray(middleware) ? middleware : [middleware]));
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('mid decorator', () => {
     it('should add middleware to the method using Reflect', () => {
       const middleware = sinon.stub(); 
       const target = {};
       const propertyKey = 'someMethod';
       const descriptor = {};
       const mockGet = sinon.stub(Reflect, 'get').returns([]);

       mid(middleware)(target, propertyKey, descriptor as PropertyDescriptor);

       expect(mockGet.calledOnceWith('middlewares', target.constructor.prototype, propertyKey)).to.be.true;
       expect(serverUtilsNormalizeStub.calledOnceWith(middleware)).to.be.true;
       expect(reflectInitStub.calledOnceWith('middlewares', [middleware], target.constructor.prototype, propertyKey)).to.be.true;

       mockGet.restore();
     });
  });
  describe('mids decorator', () => {
    it('should add class-level middleware using Reflect', () => {
      const middlewareArray = [sinon.stub(), sinon.stub()];
      class SomeClass {}
      mids(middlewareArray)(SomeClass);

      expect(serverUtilsNormalizeStub.calledOnceWith(middlewareArray)).to.be.true;
      expect(reflectInitStub.calledOnceWith('classMiddlewares', middlewareArray, SomeClass.prototype)).to.be.true;
    });
  });

  describe('Route decorator', () => {
    it('should register the route and path in Reflect and routes', () => {
      const path = '/test-path';
      class SomeClass {}
      Route(path)(SomeClass);

      expect(reflectInitStub.calledOnceWith('route', path, SomeClass.prototype)).to.be.true;
      expect(routes.get(path)).to.equal(SomeClass);
    });
  });
});
