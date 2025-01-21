import { expect } from 'chai';
import sinon from 'sinon';
import { MiddlewareFn } from '../../../dist/common/types';
import { Get, Delete, Head, Options, Patch, Post, Put, Search } from '../../../dist/decorator';
import { RouteDefinition } from '../../../dist/common/interfaces';
import { RequestMethod } from '../../../dist/common/enums';
import { createMockReflector } from '../../mocks/reflector.mock';
describe('Decorators - HTTP Method Decorators', () => {
  let mockReflector: ReturnType<typeof createMockReflector>['mockReflector'];
  let restoreReflector: ReturnType<typeof createMockReflector>['restore'];

  let defineStub: sinon.SinonStub;

  beforeEach(() => {
    const mock = createMockReflector();
    mockReflector = mock.mockReflector;
    restoreReflector = mock.restore;
    defineStub = mockReflector.define;
  });

  afterEach(() => {
    sinon.restore();
    restoreReflector();
  });

  it('should create a decorator for a specific HTTP method (GET)', () => {
    const path = '/test';
    const middlewares: MiddlewareFn[] = [];

    class TestController {
      @Get(path, middlewares)
      public getTest() {}
    }

    const routes = defineStub.getCall(0)?.args[1];
    const route = routes?.find((route: RouteDefinition) => route.method === RequestMethod.Get && route.path === '/test');

    expect(route).to.exist;
    expect(route.method).to.equal(RequestMethod.Get);
    expect(route.path).to.equal('/test');
    expect(route.middlewares).to.deep.equal(middlewares);
  });

  it('should throw error if the decorator is applied to a non-method', () => {
    const path = '/test';

    expect(() => {
      class TestController {
        @Get(path)
        public static invalidMethod() {}
      }
    }).to.throw(Error, 'Decorators cannot be applied to static methods: invalidMethod');
  });

  it('should default middlewares to an empty array if none are provided', () => {
    const path = '/test';

    class TestController {
      @Get(path)
      public getTest() {}
    }

    const routes = defineStub.getCall(0).args[1];
    const route = routes.find((route: RouteDefinition) => route.method === RequestMethod.Get && route.path === '/test');

    expect(route).to.exist;
    expect(route.middlewares).to.deep.equal([]);
  });

  it('should handle empty path and multiple slashes correctly', () => {
    const path = '///test//';

    class TestController {
      @Get(path)
      public getTest() {}
    }

    const routes = defineStub.getCall(0).args[1];
    const route = routes.find((route: RouteDefinition) => route.method === RequestMethod.Get && route.path === '/test');
    expect(route).to.exist;
    expect(route.path).to.equal('/test');
  });

  it('should generate all HTTP method decorators correctly', () => {
    const routesMock: any = [];

    defineStub.callsFake((metadataKey, metadataValue, target) => {
      if (metadataKey === 'router:routes') {
        routesMock.push(...metadataValue);
      }
    });
    const path = '/test';
    const middlewares: MiddlewareFn[] = [];

    class TestController {
      @Get(path, middlewares)
      public getTest() {}

      @Post(path, middlewares)
      public postTest() {}

      @Put(path, middlewares)
      public putTest() {}

      @Delete(path, middlewares)
      public deleteTest() {}

      @Patch(path, middlewares)
      public patchTest() {}

      @Options(path, middlewares)
      public optionsTest() {}

      @Head(path, middlewares)
      public headTest() {}

      @Search(path, middlewares)
      public searchTest() {}
    }

    expect(routesMock.length).to.equal(8);
    const methods = routesMock.map((route: RouteDefinition) => route.method);

    expect(methods).to.deep.equal([
      RequestMethod['Get'],
      RequestMethod['Post'],
      RequestMethod['Put'],
      RequestMethod['Delete'],
      RequestMethod['Patch'],
      RequestMethod['Options'],
      RequestMethod['Head'],
      RequestMethod['Search'],
    ]);
  });

  it('should handle missing controller prefix gracefully', () => {
    const path = '/test';

    class TestController {
      @Get(path)
      public getTest() {}
    }

    const routes = defineStub.getCall(0).args[1];
    const route = routes.find((route: RouteDefinition) => route.method === RequestMethod.Get && route.path === '/test');

    expect(route).to.exist;
    expect(route.path).to.equal('/test');
  });
});
