import { expect } from 'chai';
import { Channel, Controller, Injectable, METHOD_METADATA, Module, On, PATH_METADATA } from '@glandjs/common';
import { BrokerAdapter, CircularDependencyError, Context, GlandBroker, GlandFactory, UnresolvableDependencyError, type BrokerAdapterClass } from '@glandjs/core';
import { EventBroker } from '@glandjs/events';

/** Stands in for `@Get()`/`@Post()` from `@glandjs/http`. */
function route(method: string, path: string): MethodDecorator {
  return (target, key) => {
    Reflect.defineMetadata(METHOD_METADATA, method, (target as any)[key]);
    Reflect.defineMetadata(PATH_METADATA, path, (target as any)[key]);
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
}

describe('integration/bootstrap', () => {
  // ---- the application under test -----------------------------------------

  const order: string[] = [];

  /**
   * The channel's backing store.
   *
   * A single object with mutable fields rather than a `let` binding: the
   * channel is constructed once per application but the classes are declared
   * once for the whole suite, so a reassigned variable would be captured by
   * closure and every test after the first would read a stale map.
   */
  const store: { products: Map<string, Product>; nextId: number } = {
    products: new Map(),
    nextId: 1,
  };

  @Injectable()
  class Clock {
    now() {
      return 'fixed-time';
    }
  }

  @Channel('db')
  class Database {
    constructor(readonly clock: Clock) {}

    onChannelInit() {
      order.push('db:onChannelInit');
    }

    @On('product:create')
    create(input: Omit<Product, 'id'>): Product {
      const product = { id: `p${store.nextId++}`, ...input };
      store.products.set(product.id, product);
      return product;
    }

    @On('product:find')
    find(id: string): Product | null {
      return store.products.get(id) ?? null;
    }

    @On('product:all')
    all(): Product[] {
      return Array.from(store.products.values());
    }
  }

  @Injectable()
  class ProductService {
    constructor(readonly db: Database) {}

    create(input: Omit<Product, 'id'>) {
      order.push('service:create');
      return this.db.create(input);
    }
  }

  @Controller('products')
  class ProductController {
    constructor(readonly service: ProductService) {}

    onModuleInit() {
      order.push('controller:onModuleInit');
    }

    @route('GET', '/')
    list(ctx: Context<any>) {
      return this.service.db.all();
    }

    @route('GET', ':id')
    find(ctx: Context<any>, id: string) {
      return this.service.db.find(id);
    }

    @route('POST', '/')
    create(ctx: Context<any>, input: Omit<Product, 'id'>) {
      return this.service.create(input);
    }
  }

  @Module({ controllers: [ProductController], channels: [Database] })
  class ProductModule {
    onModuleInit() {
      order.push('productModule:onModuleInit');
    }
    onAppBootstrap() {
      order.push('productModule:onAppBootstrap');
    }
    onAppShutdown() {
      order.push('productModule:onAppShutdown');
    }
    onModuleDestroy() {
      order.push('productModule:onModuleDestroy');
    }
  }

  @Module({ imports: [ProductModule] })
  class AppModule {
    onModuleInit() {
      order.push('appModule:onModuleInit');
    }
  }

  // ---- a minimal adapter, standing in for @glandjs/express ----------------

  interface Registered {
    method: string;
    path: string;
    action: (ctx: any, ...args: any[]) => unknown;
  }

  class TestAdapter extends BrokerAdapter<any, Registered[], any> {
    public broker: any;
    public registered: Registered[] = [];

    constructor() {
      super(undefined);
      this.broker = new EventBroker({ name: 'test-adapter' });
    }

    public initialize(): Registered[] {
      this.broker.on('gland:define:route', (payload: any) => {
        this.registered.push({ method: payload.method, path: payload.fullPath, action: payload.action });
      });
      return this.registered;
    }
  }

  /** The routes the adapter picked up, keyed by `"METHOD path"`. */
  function routeMap(registered: Registered[]): Map<string, Registered> {
    return new Map(registered.map((r) => [`${r.method} ${r.path}`, r]));
  }

  let app: Awaited<ReturnType<typeof GlandFactory.create>>;
  let routes: Map<string, Registered>;
  let ctx: Context<any>;

  beforeEach(async () => {
    order.length = 0;
    // Reset the shared store in place: the classes are declared once for the
    // whole suite, so rebinding a variable would not reach the live instances.
    store.products.clear();
    store.nextId = 1;

    app = await GlandFactory.create(AppModule, { processHooks: { signals: [] } });

    const registered = app.app.connectTo(TestAdapter as unknown as BrokerAdapterClass<any, Registered[], any>);
    routes = routeMap(registered);

    // The real core broker, so `emit`/`call` exercise the actual routing path
    // rather than a stub.
    ctx = new Context(app.app.broker as never);
  });

  afterEach(async () => {
    await app.shutdown('test');
  });

  describe('bootstrap ordering', () => {
    it('runs lifecycle phases in the documented order', () => {
      expect(order).to.deep.equal(['appModule:onModuleInit', 'productModule:onModuleInit', 'controller:onModuleInit', 'db:onChannelInit', 'productModule:onAppBootstrap']);
    });

    it('has finished binding by the time create() resolves', () => {
      // The old implementation did not await initialize(), so routes could
      // still be missing when the caller started listening.
      expect(order).to.contain('productModule:onAppBootstrap');
    });

    it('runs shutdown hooks in order', async () => {
      await app.shutdown('SIGTERM');
      expect(order.slice(-2)).to.deep.equal(['productModule:onAppShutdown', 'productModule:onModuleDestroy']);
    });
  });

  describe('route registration', () => {
    it('registers every discovered route on the adapter', () => {
      expect([...routes.keys()]).to.have.members(['GET /products', 'GET /products/:id', 'POST /products']);
    });

    it('registers nothing before the adapter is attached', () => {
      // Sanity check that registration is driven by the broadcast, not by the
      // core holding a reference to the adapter.
      expect(routes.size).to.equal(3);
    });
  });

  describe('dependency injection', () => {
    it('shares one Database instance between the controller and the channel', () => {
      // The controller reaches the channel through ProductService, so a
      // successful create proves the singleton graph is wired.
      const created = routes.get('POST /products')!.action(ctx, { name: 'Widget', price: 10 });

      expect(order).to.contain('service:create');
      expect(store.products.size).to.equal(1);
      expect([...store.products.values()][0]).to.deep.equal({ id: 'p1', name: 'Widget', price: 10 });
      expect(created).to.deep.equal([...store.products.values()][0]);
    });

    it('exposes the same channel to every request', () => {
      routes.get('POST /products')!.action(ctx, { name: 'A', price: 1 });
      routes.get('POST /products')!.action(ctx, { name: 'B', price: 2 });

      expect(routes.get('GET /products')!.action(ctx)).to.have.lengthOf(2);
    });
  });

  describe('channel addressing', () => {
    beforeEach(() => {
      routes.get('POST /products')!.action(ctx, { name: 'Widget', price: 10 });
    });

    it('reaches a channel by its public name', () => {
      // Route one request first, so the binder attaches the registry.
      routes.get('GET /products')!.action(ctx);

      const found = ctx.call('db:product:find' as never, 'p1' as never);

      expect(found).to.deep.equal({ id: 'p1', name: 'Widget', price: 10 });
    });

    it('returns the same data whether routed directly or called by name', () => {
      const viaRoute = routes.get('GET /products')!.action(ctx);
      const viaCall = ctx.call('db:product:all' as never, {} as never);

      expect(viaCall).to.deep.equal(viaRoute);
    });

    it('throws a descriptive error for an unknown event', () => {
      expect(() => ctx.call('db:product:nope' as never, {} as never)).to.throw(/Unknown channel event/);
      expect(() => ctx.call('db:product:nope' as never, {} as never)).to.throw(/db:product:all/);
    });

    it('lists the available events in the error', () => {
      try {
        ctx.call('db:missing' as never, {} as never);
        expect.fail('should have thrown');
      } catch (error) {
        expect((error as Error).message).to.contain('db:product:create');
        expect((error as Error).message).to.contain('db:product:find');
        expect((error as Error).message).to.contain('db:product:all');
      }
    });
  });

  describe('failure handling', () => {
    it('propagates a duplicate channel name at startup', async () => {
      // Both channels must live in the *same* application: the collision is
      // global, so a fresh `create()` would not clash with the outer graph.
      @Channel('db')
      class Clash {
        @On('product:create')
        create() {
          return 'clash';
        }
      }
      @Module({ channels: [Clash, Database] })
      class ClashingModule {}

      // Failing at startup is the point: a silently shadowed handler is much
      // harder to diagnose than a duplicate-name error.
      const attempt = GlandFactory.create(ClashingModule, { processHooks: { signals: [] } });
      await expect(attempt).to.eventually.be.rejectedWith(/Duplicate channel event "db:product:create"/);
    });

    it('rejects a provider whose dependency cannot be built', async () => {
      // `missing` is an interface, so it erases to `Object` at runtime and the
      // container has no way to know what to build.
      @Injectable()
      class BrokenService {
        constructor(readonly missing: { someFlag: boolean }) {}
      }
      @Injectable()
      class Consumer {
        constructor(readonly broken: BrokenService) {}
      }
      @Controller('broken')
      class BrokenController {
        @route('GET', '/')
        index(_ctx: Context<any>, _consumer: Consumer) {
          return 'unreachable';
        }
      }
      @Module({ controllers: [BrokenController] })
      class BrokenModule {}

      // Declaring the dependency makes the container attempt construction,
      // which is where the failure surfaces.
      Reflect.defineMetadata('design:paramtypes', [Consumer], BrokenController);

      const attempt = GlandFactory.create(BrokenModule, { processHooks: { signals: [] } });
      await expect(attempt).to.eventually.be.rejectedWith(UnresolvableDependencyError);
    });

    it('rejects a module whose import graph contains a cycle', async () => {
      @Injectable()
      class Left {
        constructor(readonly right: any) {}
      }
      @Injectable()
      class Right {
        constructor(readonly left: any) {}
      }
      Reflect.defineMetadata('design:paramtypes', [Right], Left);
      Reflect.defineMetadata('design:paramtypes', [Left], Right);

      @Module({ controllers: [Left] })
      class CyclicModule {}

      const attempt = GlandFactory.create(CyclicModule, { processHooks: { signals: [] } });
      await expect(attempt).to.eventually.be.rejectedWith(CircularDependencyError);
    });
  });

  describe('broker', () => {
    it('exposes a stable id', () => {
      expect(app.app.id).to.equal('@glandjs/core');
    });

    it('links the adapter bidirectionally', () => {
      expect(app.app.broker.getConnections()).to.include('test-adapter');
    });

    it('can be shut down more than once', async () => {
      await app.shutdown();
      await app.shutdown();
    });
  });
});

describe('integration/GlandBroker', () => {
  it('assigns a unique id per broker instance', () => {
    const a = new GlandBroker();
    const b = new GlandBroker();
    expect(a.id).to.be.a('string');
    expect(a.broker).not.to.equal(b.broker);
  });

  it('releases its bus on shutdown', () => {
    const app = new GlandBroker();
    expect(() => app.shutdown()).not.to.throw();
  });
});
