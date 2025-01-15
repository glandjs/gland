import { afterEach, beforeEach, describe, it } from 'mocha';
import { Router } from '../../../dist/router/Router';
import sinon from 'sinon';
import { expect } from 'chai';
import { EventSystem } from '../../../dist/events/EventSystem';
import { MiddlewareStack } from '../../../dist/middleware/index';
import { RouteDefinition } from '../../../dist/common/interfaces';
import Reflector from '../../../dist/metadata';
import { RouterMetadataKeys } from '../../../dist/common/enums';

describe('Router', () => {
  let router: Router;
  const apiPrefix = '/api';
  let events: EventSystem;

  beforeEach(() => {
    events = new EventSystem();
    router = new Router(apiPrefix, events);
    sinon.stub(MiddlewareStack.prototype, 'use');
    sinon.stub(MiddlewareStack.prototype, 'execute');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('findMatch', () => {
    it('should find a route that matches the method, path, and language', () => {
      const routes: RouteDefinition[] = [
        {
          query: {},
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
          query: {},
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
});
