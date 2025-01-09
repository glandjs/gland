import { afterEach, beforeEach, describe, it } from 'mocha';
import { Router } from '../../../lib/router/Router';
import sinon from 'sinon';
import Reflector from '../../../lib/metadata';
import { MiddlewareManager } from '../../../lib/middleware/MiddlewareManager';
import { RouteDefinition } from '../../../lib/common/interface/router.interface';
import { RouterMetadataKeys } from '../../../lib/common/constants';
import { expect } from 'chai';
import { HttpContext } from '../../../lib/types';

describe('Router', () => {
  let router: Router;
  const apiPrefix = '/api';

  beforeEach(() => {
    router = new Router(apiPrefix);
    sinon.stub(MiddlewareManager.prototype, 'use');
    sinon.stub(MiddlewareManager.prototype, 'run');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('findMatch', () => {
    it('should find a route that matches the method, path, and language', () => {
      const routes: RouteDefinition[] = [
        {
          params: {},
          method: 'GET',
          path: '/users/:id',
          action: () => {},
          constructor: class {},
          middlewares: [],
        },
      ];
      sinon.stub(Reflector, 'getRoutes').returns(routes);
      sinon.stub(Reflector, 'get').withArgs(RouterMetadataKeys.MULTI_LANG, routes[0].constructor).returns({
        en: '/users/:id',
        fr: '/utilisateurs/:id',
      });

      const match = router.findMatch('GET', '/users/123', 'en');
      expect(match).to.deep.include({
        method: 'GET',
        path: '/api/users/:id',
        params: { id: '123' },
      });
    });

    it('should return null if no route matches', () => {
      const routes: RouteDefinition[] = [];
      sinon.stub(Reflector, 'getRoutes').returns(routes);

      const match = router.findMatch('GET', '/users/123', 'en');
      expect(match).to.be.null;
    });

    it('should handle multi-language routes correctly', () => {
      const routes: RouteDefinition[] = [
        {
          method: 'GET',
          params: {},
          path: '/users/:id',
          action: () => {},
          constructor: class {},
          middlewares: [],
        },
      ];
      sinon.stub(Reflector, 'getRoutes').returns(routes);
      sinon.stub(Reflector, 'get').withArgs(RouterMetadataKeys.MULTI_LANG, routes[0].constructor).returns({
        en: '/users/:id',
        fr: '/utilisateurs/:id',
      });

      const match = router.findMatch('GET', '/utilisateurs/123', 'fr');
      expect(match).to.deep.include({
        method: 'GET',
        path: '/api/utilisateurs/:id',
        params: { id: '123' },
      });
    });
  });

  describe('run', () => {
    describe('when no route is found', () => {
      it('should do nothing', async () => {
        const routes: RouteDefinition[] = []; // No routes defined
        sinon.stub(Reflector, 'getRoutes').returns(routes);

        const ctx = { method: 'GET', url: '/unknown', headers: { 'accept-language': 'en' } } as HttpContext;
        await router.run(ctx);

        // Verify that no middleware or action was executed
        expect((MiddlewareManager.prototype.use as any).called).to.be.false;
        expect((MiddlewareManager.prototype.run as any).called).to.be.false;
      });
    });
  });
});
