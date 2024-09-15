import { expect } from 'chai';
import * as sinon from 'sinon';
import { Gmids, midManager } from '../../../lib/core/middleware';
import { ServerUtils } from '../../../lib/helper';
import { Gland } from '../../../lib/types/index';

describe('Gmids and midManager', () => {
  let serverUtilsNormalizeStub: sinon.SinonStub;

  beforeEach(() => {
    serverUtilsNormalizeStub = sinon.stub(ServerUtils, 'normalize').callsFake((middleware: any) => (Array.isArray(middleware) ? middleware : [middleware]));
    (Gmids as any).mids = [];
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Gmids', () => {
    describe('set', () => {
      it('should add middleware to the mids array', () => {
        const middleware = sinon.stub();
        Gmids.set(middleware);

        expect(serverUtilsNormalizeStub.calledOnceWith(middleware)).to.be.true;
        expect(Gmids.get()).to.include(middleware);
      });

      it('should handle multiple middlewares', () => {
        const middlewareArray = [sinon.stub(), sinon.stub()];
        Gmids.set(middlewareArray);
        expect(serverUtilsNormalizeStub.calledOnceWith(middlewareArray)).to.be.true;
        expect(Gmids.get()).to.deep.equal(middlewareArray);
      });
    });

    describe('get', () => {
      it('should return an empty array when no middlewares are set', () => {
        sinon.stub(Gmids, 'get').returns([]);
        expect(Gmids.get()).to.deep.equal([]);
      });

      it('should return the current middlewares', () => {
        const middleware = sinon.stub();
        Gmids.set(middleware);
        expect(Gmids.get()).to.include(middleware);
      });
    });
  });

  describe('midManager', () => {
    let middlewares: Gland.Middleware[];

    beforeEach(() => {
      middlewares = [];
    });

    describe('process', () => {
      it('should throw an error for invalid middleware/handler signature', () => {
        const path = '/test';
        const invalidHandler: any = sinon.stub().callsFake(() => {});

        expect(() => midManager.process(path, [invalidHandler], middlewares)).to.throw('Invalid middleware/handler function signature');
      });

      it('should handle non-string path and add unique middlewares', () => {
        const handler1: Gland.GlandMiddleware = sinon.stub();
        const handler2: Gland.GlandMiddleware = sinon.stub();

        midManager.process(handler1, [handler1, handler2], middlewares);

        expect(middlewares).to.have.lengthOf(2);
        expect(middlewares).to.include(handler1);
        expect(middlewares).to.include(handler2);
      });
    });
  });
});
