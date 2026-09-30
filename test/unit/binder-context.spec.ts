import { expect } from 'chai';
import { Channel, Controller, METHOD_METADATA, Module as GlandModule, On, PATH_METADATA, ChannelRegistryBuilder } from '@glandjs/common';
import { ApplicationBinder, Container, Context, Explorer, UnknownEventError } from '@glandjs/core';
import { EventBroker } from '@glandjs/events';

/** Stands in for `@Get()`/`@Post()` from `@glandjs/http`. */
function route(method: string, path: string): MethodDecorator {
  return (target, key) => {
    Reflect.defineMetadata(METHOD_METADATA, method, (target as any)[key]);
    Reflect.defineMetadata(PATH_METADATA, path, (target as any)[key]);
  };
}

/** Builds an explorer over a throwaway module graph. */
async function explorerFor(controllers: any[] = [], channels: any[] = []): Promise<Explorer> {
  @GlandModule({ controllers, channels })
  class Root {}

  const container = new Container();
  await container.register(Root);
  return new Explorer(container.moduleContainer);
}

/** Collects the route broadcasts an adapter would receive. */
function recorder(broker: any) {
  const routes: any[] = [];
  broker.on('gland:define:route', (payload: any) => {
    routes.push(payload);
  });
  return routes;
}

describe('core/application/ApplicationBinder', () => {
  it('broadcasts one payload per discovered route', async () => {
    @Controller('products')
    class Ctrl {
      @route('GET', '/')
      list() {
        return 'list';
      }
      @route('GET', ':id')
      find() {
        return 'find';
      }
      @route('POST', '/')
      create() {
        return 'create';
      }
    }

    const broker = new EventBroker({ name: 'core' });
    const routes = recorder(broker);
    const binder = new ApplicationBinder(await explorerFor([Ctrl]), broker as never, new ChannelRegistryBuilder());
    binder.bind();

    expect(routes).to.have.lengthOf(3);
    expect(routes.map((r) => `${r.method} ${r.fullPath}`)).to.have.members(['GET /products', 'GET /products/:id', 'POST /products']);
  });

  it('combines the controller prefix with the handler path', async () => {
    @Controller('/api/v1/')
    class Ctrl {
      @route('GET', '/health')
      health() {}
    }

    const broker = new EventBroker({ name: 'core' });
    const routes = recorder(broker);
    new ApplicationBinder(await explorerFor([Ctrl]), broker as never, new ChannelRegistryBuilder()).bind();

    expect(routes[0].fullPath).to.equal('/api/v1/health');
    expect(routes[0].path).to.equal('/health');
  });

  it('upper-cases the method', async () => {
    @Controller()
    class Ctrl {
      @route('get', '/')
      index() {}
    }

    const broker = new EventBroker({ name: 'core' });
    const routes = recorder(broker);
    new ApplicationBinder(await explorerFor([Ctrl]), broker as never, new ChannelRegistryBuilder()).bind();

    expect(routes[0].method).to.equal('GET');
  });

  it('invokes the handler with the controller as `this`', async () => {
    @Controller()
    class Ctrl {
      readonly prefix = 'v1';
      @route('GET', '/')
      index() {
        return this.prefix;
      }
    }

    const broker = new EventBroker({ name: 'core' });
    const routes = recorder(broker);
    new ApplicationBinder(await explorerFor([Ctrl]), broker as never, new ChannelRegistryBuilder()).bind();

    // A bare `target(ctx)` would run with `this === undefined` and throw here.
    expect(routes[0].action({})).to.equal('v1');
  });

  it('attaches the broker id and registry to the context', async () => {
    @Controller()
    class Ctrl {
      @route('GET', '/')
      index() {}
    }

    const broker = new EventBroker({ name: 'my-core' });
    const routes = recorder(broker);
    new ApplicationBinder(await explorerFor([Ctrl]), broker as never, new ChannelRegistryBuilder()).bind();

    // A real context, so `attachRegistry` is actually exercised.
    const ctx = new Context({} as never);
    routes[0].action(ctx);

    expect(ctx.state.brokerId).to.equal('my-core');
    expect(ctx.state.channel).to.exist;
  });

  it('shares one frozen registry across every request', async () => {
    @Controller()
    class A {
      @route('GET', '/a')
      a() {}
    }
    @Controller()
    class B {
      @route('GET', '/b')
      b() {}
    }

    const broker = new EventBroker({ name: 'core' });
    const routes = recorder(broker);
    new ApplicationBinder(await explorerFor([A, B]), broker as never, new ChannelRegistryBuilder()).bind();

    const first = new Context({} as never);
    const second = new Context({} as never);
    routes[0].action(first);
    routes[1].action(second);

    // Copying the whole channel table per request was O(n) on the hot path.
    expect(first.state.channel).to.equal(second.state.channel);
    expect(Object.isFrozen(first.state.channel)).to.be.true;
  });

  describe('channel binding', () => {
    it('subscribes each handler to its broker event', async () => {
      @Channel('db')
      class Database {
        @On('product:create')
        create(input: any) {
          return { id: '1', ...input };
        }
      }

      const broker = new EventBroker({ name: 'core' });
      new ApplicationBinder(await explorerFor([], [Database]), broker as never, new ChannelRegistryBuilder()).bind();

      expect(broker.getListener('gland:define:channel:db:product:create')).to.have.lengthOf(1);
    });

    it('indexes handlers by their public name', async () => {
      @Channel('db')
      class Database {
        @On('product:create')
        create() {}
      }
      @Channel('audit')
      class Audit {
        @On('record')
        record() {}
      }

      const broker = new EventBroker({ name: 'core' });
      const builder = new ChannelRegistryBuilder();
      const binder = new ApplicationBinder(await explorerFor([], [Database, Audit]), broker as never, builder);
      binder.bind();

      expect(binder.channelRegistry).to.deep.equal({
        'db:product:create': 'gland:define:channel:db:product:create',
        'audit:record': 'gland:define:channel:audit:record',
      });
    });

    it('passes arguments and the return value through', async () => {
      @Channel('db')
      class Database {
        @On('product:create')
        create(input: any) {
          return { id: 'generated', name: input.name };
        }
      }

      const broker = new EventBroker({ name: 'core' });
      new ApplicationBinder(await explorerFor([], [Database]), broker as never, new ChannelRegistryBuilder()).bind();

      expect(broker.call('gland:define:channel:db:product:create', { name: 'Widget' })).to.deep.equal({ id: 'generated', name: 'Widget' });
    });

    it('rejects a duplicated public name at bind time', async () => {
      @Channel('db')
      class First {
        @On('create')
        create() {
          return 'first';
        }
      }
      @Channel('db')
      class Second {
        @On('create')
        create() {
          return 'second';
        }
      }

      const broker = new EventBroker({ name: 'core' });
      const binder = new ApplicationBinder(await explorerFor([], [First, Second]), broker as never, new ChannelRegistryBuilder());

      // Previously both bound, and the first one discovered silently won.
      expect(() => binder.bind()).to.throw(/Duplicate channel event "db:create"/);
    });

    it('keeps same-suffix handlers in different namespaces reachable', async () => {
      @Channel('db')
      class Database {
        @On('create')
        create() {
          return 'from-db';
        }
      }
      @Channel('cache')
      class Cache {
        @On('create')
        create() {
          return 'from-cache';
        }
      }

      const broker = new EventBroker({ name: 'core' });
      new ApplicationBinder(await explorerFor([], [Database, Cache]), broker as never, new ChannelRegistryBuilder()).bind();

      // The old suffix-only lookup made these two indistinguishable.
      expect(broker.call('gland:define:channel:db:create', {})).to.equal('from-db');
      expect(broker.call('gland:define:channel:cache:create', {})).to.equal('from-cache');
    });

    it('supports a channel with no namespace', async () => {
      @Channel()
      class Health {
        @On('ping')
        ping() {
          return 'pong';
        }
      }

      const broker = new EventBroker({ name: 'core' });
      const builder = new ChannelRegistryBuilder();
      const binder = new ApplicationBinder(await explorerFor([], [Health]), broker as never, builder);
      binder.bind();

      expect(binder.channelRegistry).to.deep.equal({ ping: 'gland:define:channel:ping' });
    });
  });
});

describe('core/context/Context', () => {
  /** A context wired to `registry`, as the binder would attach it. */
  function contextFor(registry: Record<string, string>, broker: any) {
    const ctx = new Context(broker);
    ctx.attachRegistry('core-id', Object.freeze(registry));
    return ctx;
  }

  describe('emit', () => {
    it('routes to the handler for a namespaced event', () => {
      const seen: any[] = [];
      const broker = { emit: (ev: string, payload: any) => void seen.push([ev, payload]) };
      const ctx = contextFor({ 'db:product:create': 'gland:define:channel:db:product:create' }, broker);

      ctx.emit('db:product:create' as never, { name: 'Widget' } as never);

      expect(seen).to.deep.equal([['gland:define:channel:db:product:create', { name: 'Widget' }]]);
    });

    it('emits on the core bus, not the adapter bus', () => {
      const coreEvents: string[] = [];
      const localEvents: string[] = [];

      const core = {
        emit: (ev: string) => void coreEvents.push(ev),
      };
      const adapter = {
        emit: (ev: string) => void localEvents.push(ev),
        getConnection: (id: string) => (id === 'core-id' ? core : undefined),
      };

      const ctx = new Context(adapter as never);
      ctx.attachRegistry('core-id', Object.freeze({ ping: 'gland:define:channel:ping' }));
      ctx.emit('ping' as never, {} as never);

      expect(coreEvents).to.deep.equal(['gland:define:channel:ping']);
      expect(localEvents).to.deep.equal([]);
    });

    it('throws a helpful error for an unknown event', () => {
      const broker = { emit: () => {} };
      const ctx = contextFor({ 'db:known': 'gland:define:channel:db:known' }, broker);

      expect(() => ctx.emit('db:typo' as never, {} as never)).to.throw(UnknownEventError);
      expect(() => ctx.emit('db:typo' as never, {} as never)).to.throw(/Known channel events[\s\S]*db:known/);
    });

    it('reports when no channels are registered', () => {
      const ctx = contextFor({}, { emit: () => {} });
      expect(() => ctx.emit('anything' as never, {} as never)).to.throw(/No channels are registered/);
    });

    it('fails clearly when not attached to a broker', () => {
      const ctx = new Context({ emit: () => {} } as never);
      expect(() => ctx.emit('x' as never, {} as never)).to.throw(/not attached to an application broker/);
    });
  });

  describe('call', () => {
    it('returns the handler result', () => {
      const broker = { call: (ev: string) => (ev === 'gland:define:channel:db:find' ? { id: '1' } : undefined) };
      const ctx = contextFor({ 'db:find': 'gland:define:channel:db:find' }, broker);

      expect(ctx.call('db:find' as never, {} as never)).to.deep.equal({ id: '1' });
    });

    it('forwards the "all" strategy', () => {
      const calls: any[] = [];
      const broker = {
        call: (ev: string, _data: any, strategy?: string) => {
          calls.push([ev, strategy]);
          return strategy === 'all' ? ['a', 'b'] : 'a';
        },
      };
      const ctx = contextFor({ 'db:find': 'gland:define:channel:db:find' }, broker);

      expect(ctx.call('db:find' as never, {} as never, 'all')).to.deep.equal(['a', 'b']);
      expect(calls[0]).to.deep.equal(['gland:define:channel:db:find', 'all']);
    });

    it('omits the strategy argument when not given', () => {
      const calls: any[] = [];
      const broker = {
        call: (...args: any[]) => {
          calls.push(args);
          return 'ok';
        },
      };
      const ctx = contextFor({ 'db:find': 'gland:define:channel:db:find' }, broker);

      ctx.call('db:find' as never, {} as never);
      expect(calls[0]).to.have.lengthOf(2);
    });

    it('dispatches on the bus the channels were bound to', () => {
      // An HTTP request enters the adapter broker, but the channels live on
      // the core bus reachable as its connection. Dispatching locally found no
      // listener and returned nothing.
      const coreCalls: any[] = [];
      const localCalls: any[] = [];

      const core = {
        id: 'core-id',
        call: (ev: string) => {
          coreCalls.push(ev);
          return 'from-core';
        },
      };
      const adapter = {
        id: 'http',
        call: (ev: string) => {
          localCalls.push(ev);
          return 'from-adapter';
        },
        getConnection: (id: string) => (id === 'core-id' ? core : undefined),
      };

      const ctx = new Context(adapter as never);
      ctx.attachRegistry('core-id', Object.freeze({ 'db:find': 'gland:define:channel:db:find' }));

      expect(ctx.call('db:find' as never, {} as never)).to.equal('from-core');
      expect(coreCalls).to.deep.equal(['gland:define:channel:db:find']);
      expect(localCalls).to.deep.equal([]);
    });

    it('falls back to the local bus when it is not linked to a core', () => {
      const broker = { call: () => 'local' };
      const ctx = new Context(broker as never);
      ctx.attachRegistry('core-id', Object.freeze({ ping: 'gland:define:channel:ping' }));

      expect(ctx.call('ping' as never, {} as never)).to.equal('local');
    });
  });

  describe('state', () => {
    it('merges on assignment instead of replacing', () => {
      const ctx = new Context({} as never);
      ctx.state = { a: 1 };
      ctx.state = { b: 2 };

      expect(ctx.state).to.deep.equal({ a: 1, b: 2 });
    });

    it('exposes setState for an explicit merge', () => {
      const ctx = new Context({} as never);
      ctx.setState({ a: 1 }).setState({ b: 2 });
      expect(ctx.state).to.deep.equal({ a: 1, b: 2 });
    });
  });

  describe('on / once', () => {
    it('returns the context for chaining', () => {
      const broker = { on: () => 'broker', once: () => 'broker', off: () => undefined };
      const ctx = new Context(broker as never);

      expect(ctx.on('x' as never, (() => {}) as never)).to.equal(ctx);
      expect(ctx.once('x' as never, (() => {}) as never)).to.equal(ctx);
    });

    it('passes a watch promise through', async () => {
      const broker = { on: () => Promise.resolve('payload'), once: () => Promise.resolve('payload') };
      const ctx = new Context(broker as never);

      expect(await ctx.on('x' as never, null, { watch: true } as never)).to.equal('payload');
      expect(await ctx.once('x' as never, null, { watch: true } as never)).to.equal('payload');
    });
  });
});
