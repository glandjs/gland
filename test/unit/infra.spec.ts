import { expect } from 'chai';
import { Channel, Controller, loadPackage, MissingDependencyError, Module as GlandModule, On } from '@glandjs/common';
import { Container, DiscoveryService, InstanceWrapper, ModulesContainer } from '@glandjs/core';

describe('common/utils/loadPackage', () => {
  it('returns whatever the loader produces', () => {
    expect(loadPackage('anything', 'a reason', () => ({ ok: true }))).to.deep.equal({ ok: true });
  });

  it('resolves a package that exists', () => {
    expect(loadPackage('node:path', 'path utilities')).to.have.property('join');
  });

  it('throws MissingDependencyError for a package that does not', () => {
    // Previously this called process.exit(1), which made it unusable in a
    // server that needs to degrade and impossible to test.
    expect(() => loadPackage('@glandjs/definitely-not-installed', 'nothing')).to.throw(MissingDependencyError);
  });

  it('names the package and the reason', () => {
    try {
      loadPackage('@glandjs/definitely-not-installed', 'CORS support');
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(MissingDependencyError);
      expect((error as MissingDependencyError).packageName).to.equal('@glandjs/definitely-not-installed');
      expect((error as Error).message).to.contain('@glandjs/definitely-not-installed');
      expect((error as Error).message).to.contain('CORS support');
    }
  });

  it('wraps a failure thrown by a custom loader', () => {
    expect(() =>
      loadPackage('x', 'reason', () => {
        throw new Error('loader exploded');
      }),
    ).to.throw(MissingDependencyError);
  });
});

describe('core/injector/InstanceWrapper', () => {
  describe('id', () => {
    it('uses a string token verbatim', () => {
      expect(new InstanceWrapper('featureFlags').id).to.equal('featureFlags');
    });

    it('uses a symbol description', () => {
      expect(new InstanceWrapper(Symbol('dbToken')).id).to.equal('dbToken');
    });

    it('falls back to the symbol itself when it has no description', () => {
      const anonymous = Symbol();
      expect(new InstanceWrapper(anonymous).id).to.equal(anonymous.toString());
    });

    it('uses a class name', () => {
      class UserService {}
      expect(new InstanceWrapper(UserService).id).to.equal('UserService');
    });

    it('reports an anonymous class as such', () => {
      const anonymous = (() => class {})();
      expect(new InstanceWrapper(anonymous).id).to.equal('anonymous');
    });
  });

  describe('isResolved', () => {
    it('is false before an instance is supplied', () => {
      expect(new InstanceWrapper(class Service {}).isResolved).to.be.false;
    });

    it('is true once an instance is supplied', () => {
      class Service {}
      expect(new InstanceWrapper(Service, new Service()).isResolved).to.be.true;
    });
  });

  describe('getInstance', () => {
    it('returns the instance', () => {
      class Service {}
      const instance = new Service();
      expect(new InstanceWrapper(Service, instance).getInstance()).to.equal(instance);
    });

    it('throws a helpful error when unresolved', () => {
      class Service {}
      expect(() => new InstanceWrapper(Service).getInstance()).to.throw(/has not been instantiated/);
      expect(() => new InstanceWrapper(Service).getInstance()).to.throw(/never resolved/);
    });

    it('names the provider in the error', () => {
      class UserService {}
      expect(() => new InstanceWrapper(UserService).getInstance()).to.throw(/UserService/);
    });
  });

  describe('tryGetInstance', () => {
    it('returns undefined rather than throwing', () => {
      expect(new InstanceWrapper(class Service {}).tryGetInstance()).to.be.undefined;
    });

    it('returns the instance when present', () => {
      class Service {}
      const instance = new Service();
      expect(new InstanceWrapper(Service, instance).tryGetInstance()).to.equal(instance);
    });
  });

  describe('falsy instances', () => {
    // The old check was `if (!this.instance)`, so a provider whose instance
    // was legitimately falsy was reported as missing.
    for (const [label, value] of [
      ['0', 0],
      ['empty string', ''],
      ['false', false],
      ['null', null],
    ] as const) {
      it(`accepts ${label} as a resolved instance`, () => {
        const wrapper = new InstanceWrapper<any>(class Service {}, value);
        expect(wrapper.isResolved).to.be.true;
        expect(wrapper.getInstance()).to.equal(value);
      });
    }

    it('still reports an omitted instance as missing', () => {
      expect(() => new InstanceWrapper(class Service {}).getInstance()).to.throw();
    });
  });
});

describe('core/injector/ModulesContainer', () => {
  /**
   * Builds `A -> B -> C` plus the diamond `A -> C`, so traversal has something
   * to de-duplicate.
   */
  function graph() {
    const container = new ModulesContainer();
    const make = (token: string) => {
      const ref: any = { token, metatype: class {}, instance: undefined, imports: new Set(), controllers: new Map(), channels: new Map() };
      container.set(token, ref);
      return ref;
    };

    const c = make('C');
    const b = make('B');
    const a = make('A');

    a.imports.add(b);
    a.imports.add(c);
    b.imports.add(c);

    return { container, a, b, c };
  }

  it('looks a module up by token in constant time', () => {
    const { container, a } = graph();
    expect(container.getByToken('A')).to.equal(a);
    expect(container.getByToken('Nope')).to.be.undefined;
  });

  it('walks the tree depth-first from a root', () => {
    const { container, a } = graph();
    expect(container.traverse(a).map((m) => m.token)).to.deep.equal(['A', 'B', 'C']);
  });

  it('yields a shared module once even when reached twice', () => {
    const { container, a } = graph();
    // A diamond: both A and B import C.
    expect(container.traverse(a).map((m) => m.token)).to.deep.equal(['A', 'B', 'C']);
  });

  it('walks every registered module when no root is given', () => {
    const { container } = graph();
    // In insertion order: a bare `traverse()` is a map walk, not a sorted one.
    expect(container.traverse().map((m) => m.token)).to.deep.equal(['C', 'B', 'A']);
  });
});

describe('core/injector/DiscoveryService', () => {
  /** Registers a graph and returns a DiscoveryService over it. */
  async function serviceFor(controllers: any[] = [], channels: any[] = []) {
    @GlandModule({ controllers, channels })
    class Root {}
    const container = new Container();
    await container.register(Root);
    return { service: new DiscoveryService(container.moduleContainer), container };
  }

  describe('getControllers', () => {
    it('finds only decorated controllers', async () => {
      @Controller('a')
      class Decorated {}

      class Undecorated {}

      const { service } = await serviceFor([Decorated, Undecorated]);
      const found = service.getControllers('path');

      expect(found).to.have.lengthOf(1);
      expect(found[0].token).to.equal(Decorated);
    });

    it('filters by metadata value', async () => {
      @Controller('a')
      class Alpha {}
      @Controller('b')
      class Beta {}

      const { service } = await serviceFor([Alpha, Beta]);

      expect(service.getControllers('path', 'a').map((w) => w.token)).to.deep.equal([Alpha]);
      expect(service.getControllers('path', 'b').map((w) => w.token)).to.deep.equal([Beta]);
      expect(service.getControllers('path', 'c')).to.have.lengthOf(0);
    });

    it('returns nothing when the key is absent', async () => {
      @Controller('a')
      class Ctrl {}
      const { service } = await serviceFor([Ctrl]);

      expect(service.getControllers('no-such-key')).to.have.lengthOf(0);
    });
  });

  describe('getChannels', () => {
    it('finds only decorated channels', async () => {
      @Channel('a')
      class Decorated {}

      class Undecorated {}

      const { service } = await serviceFor([], [Decorated, Undecorated]);
      const found = service.getChannels('path');

      expect(found).to.have.lengthOf(1);
      expect(found[0].token).to.equal(Decorated);
    });

    it('filters by namespace', async () => {
      @Channel('db')
      class Database {}
      @Channel('cache')
      class Cache {}

      const { service } = await serviceFor([], [Database, Cache]);

      expect(service.getChannels('path', 'db').map((w) => w.token)).to.deep.equal([Database]);
      expect(service.getChannels('path', 'cache').map((w) => w.token)).to.deep.equal([Cache]);
      expect(service.getChannels('path', 'absent')).to.have.lengthOf(0);
    });

    it('finds a channel that declares no namespace', async () => {
      @Channel()
      class Health {
        @On('ping')
        ping() {}
      }

      const { service } = await serviceFor([], [Health]);
      // An omitted namespace is '' rather than the string 'undefined'.
      expect(service.getChannels('path', '')).to.have.lengthOf(1);
    });
  });
});
