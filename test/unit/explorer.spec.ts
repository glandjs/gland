import { expect } from 'chai';
import { Channel, Controller, METHOD_METADATA, On, PATH_METADATA } from '@glandjs/common';
import { Explorer, InstanceWrapper, MetadataScanner, ModulesContainer } from '@glandjs/core';

describe('core/injector/MetadataScanner', () => {
  it('lists own methods and excludes the constructor', () => {
    class Ctrl {
      a() {}
      b() {}
    }
    const names = new MetadataScanner().getAllFilteredMethodNames(Ctrl.prototype);

    expect(names).to.include('a');
    expect(names).to.include('b');
    expect(names).not.to.include('constructor');
  });

  it('excludes accessors', () => {
    class Ctrl {
      get computed() {
        return 1;
      }
      set computed(_v: number) {}
      real() {}
    }
    const names = new MetadataScanner().getAllFilteredMethodNames(Ctrl.prototype);

    expect(names).to.deep.equal(['real']);
  });

  it('returns handler results in declaration order', () => {
    class Ctrl {
      a() {}
      b() {}
      c() {}
    }
    const upper = new MetadataScanner().scanFromPrototype(Ctrl.prototype, (n) => n.toUpperCase());
    expect(upper).to.deep.equal(['A', 'B', 'C']);
  });
});

describe('core/injector/Explorer', () => {
  /** Builds a ModulesContainer holding one module with the given providers. */
  function containerWith(providers: { controllers?: any[]; channels?: any[] }): ModulesContainer {
    const container = new ModulesContainer();
    const moduleRef: any = {
      token: 'TestModule',
      metatype: class TestModule {},
      imports: new Set(),
      controllers: new Map(),
      channels: new Map(),
      instance: new (class TestModule {})(),
    };
    for (const c of providers.controllers ?? []) moduleRef.controllers.set(c, new InstanceWrapper(c, new c()));
    for (const c of providers.channels ?? []) moduleRef.channels.set(c, new InstanceWrapper(c, new c()));
    container.set('TestModule', moduleRef);
    return container;
  }

  describe('exploreControllers', () => {
    /**
     * Stands in for `@Get()`/`@Post()`: the HTTP layer lives in
     * `@glandjs/http`, so the core suite writes the metadata directly.
     */
    function route(method: string, path: string): MethodDecorator {
      return (target, key) => {
        Reflect.defineMetadata(METHOD_METADATA, method, (target as any)[key]);
        Reflect.defineMetadata(PATH_METADATA, path, (target as any)[key]);
      };
    }

    it('discovers a route from @Controller + a method decorator', () => {
      @Controller('products')
      class Ctrl {
        @route('GET', '/')
        list() {
          return 'list';
        }
      }

      const [found] = new Explorer(containerWith({ controllers: [Ctrl] })).exploreControllers();

      expect(found.method).to.equal('GET');
      expect(found.route).to.equal('/');
      expect(found.controller.path).to.equal('products');
      expect(found.controller.methodName).to.equal('list');
    });

    it('reports the handler path relative to the controller prefix', () => {
      @Controller('products')
      class Ctrl {
        @route('GET', ':id')
        find() {}
      }

      const [found] = new Explorer(containerWith({ controllers: [Ctrl] })).exploreControllers();
      expect(found.route).to.equal(':id');
    });

    it('defaults an omitted controller prefix to "/"', () => {
      class Ctrl {
        @route('GET', '/health')
        health() {}
      }

      const [found] = new Explorer(containerWith({ controllers: [Ctrl] })).exploreControllers();
      expect(found.controller.path).to.equal('/');
    });

    it('ignores undecorated methods', () => {
      @Controller('products')
      class Ctrl {
        helper() {}
      }
      expect(new Explorer(containerWith({ controllers: [Ctrl] })).exploreControllers()).to.have.lengthOf(0);
    });

    it('passes the live controller instance through', () => {
      @Controller()
      class Ctrl {
        @route('GET', '/')
        get() {
          return this.value;
        }
        readonly value = 'value';
      }

      const [found] = new Explorer(containerWith({ controllers: [Ctrl] })).exploreControllers();
      expect(found.controller.instance).to.be.instanceOf(Ctrl);
      expect(found.controller.target.call(found.controller.instance)).to.equal('value');
    });

    it('finds every decorated method on a controller', () => {
      @Controller('products')
      class Ctrl {
        @route('GET', '/')
        list() {}
        @route('POST', '/')
        create() {}
        @route('GET', ':id')
        find() {}
      }

      const found = new Explorer(containerWith({ controllers: [Ctrl] })).exploreControllers();
      expect(found).to.have.lengthOf(3);
      expect(found.map((r) => r.method)).to.have.members(['GET', 'POST', 'GET']);
    });
  });

  describe('exploreChannels', () => {
    it('discovers a handler and its namespace', () => {
      @Channel('db')
      class Database {
        @On('product:create')
        create() {}
      }
      const [channel] = new Explorer(containerWith({ channels: [Database] })).exploreChannels();

      expect(channel.namespace).to.equal('db');
      expect(channel.event).to.equal('product:create');
      expect(channel.instance).to.be.instanceOf(Database);
      expect(channel.target.name).to.equal('create');
    });

    it('defaults an omitted namespace to the empty string', () => {
      @Channel()
      class Health {
        @On('ping')
        ping() {}
      }
      const [channel] = new Explorer(containerWith({ channels: [Health] })).exploreChannels();

      // Previously an omitted namespace became the literal "undefined".
      expect(channel.namespace).to.equal('');
    });

    it('ignores methods without @On', () => {
      @Channel('db')
      class Database {
        helper() {}
      }
      expect(new Explorer(containerWith({ channels: [Database] })).exploreChannels()).to.have.lengthOf(0);
    });

    it('finds handlers across several channels', () => {
      @Channel('a')
      class A {
        @On('one')
        one() {}
        @On('two')
        two() {}
      }
      @Channel('b')
      class B {
        @On('three')
        three() {}
      }
      const result = new Explorer(containerWith({ channels: [A, B] })).exploreChannels();

      expect(result).to.have.lengthOf(3);
      expect(result.map((c) => `${c.namespace}:${c.event}`)).to.have.members(['a:one', 'a:two', 'b:three']);
    });
  });
});
