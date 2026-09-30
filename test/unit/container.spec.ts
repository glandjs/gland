import { expect } from 'chai';
import { Channel, Inject, Injectable, Module as GlandModule, On, forwardRef } from '@glandjs/common';
import { CircularDependencyError, Container, DependenciesScanner, ModuleRef, UnresolvableDependencyError } from '@glandjs/core';

describe('core/injector/Container', () => {
  describe('resolve', () => {
    it('constructs a provider with no dependencies', () => {
      class Service {
        readonly value = 42;
      }
      const container = new Container();

      expect(container.resolve(Service).value).to.equal(42);
    });

    it('injects constructor parameters from design:paramtypes', () => {
      @Injectable()
      class Engine {}

      @Injectable()
      class Car {
        constructor(
          public readonly engine: Engine,
          public readonly wheels: number,
        ) {}
      }
      const container = new Container();

      const car = container.resolve(Car);
      expect(car.engine).to.be.instanceOf(Engine);
      expect(car.wheels).to.equal(0);
    });

    it('explains that a decorated class is what unlocks metadata emission', () => {
      // TypeScript only writes `design:paramtypes` for decorated classes, so an
      // undecorated class with constructor arguments used to receive a row of
      // `undefined`s with no warning.
      class Undecorated {
        constructor(readonly dep: { some: string }) {}
      }
      expect(() => new Container().resolve(Undecorated)).to.throw(/@Injectable\(\)/);
    });

    it('returns the same instance on repeated resolution', () => {
      @Injectable()
      class Service {}
      const container = new Container();

      const first = container.resolve(Service);
      const second = container.resolve(Service);
      expect(first).to.equal(second);
      expect(container.has(Service)).to.be.true;
    });

    it('shares nested singletons across consumers', () => {
      @Injectable()
      class Shared {}

      @Injectable()
      class A {
        constructor(readonly shared: Shared) {}
      }

      @Injectable()
      class B {
        constructor(readonly shared: Shared) {}
      }
      const container = new Container();

      expect(container.resolve(A).shared).to.equal(container.resolve(B).shared);
    });

    it('rejects a bare string token outside of @Inject', () => {
      const container = new Container();
      expect(() => container.resolve('someToken' as never)).to.throw(UnresolvableDependencyError);
    });
  });

  describe('@Inject', () => {
    it('injects by class token', () => {
      class Repo {}
      class Service {
        constructor(@Inject(Repo) readonly repo: Repo) {}
      }

      expect(new Container().resolve(Service).repo).to.be.instanceOf(Repo);
    });

    it('takes precedence over design:paramtypes', () => {
      class Injected {}
      class Reflected {}
      class Service {
        constructor(@Inject(Injected) readonly dep: any) {}
      }
      // The compiler would have emitted [Reflected]; @Inject must win.
      Reflect.defineMetadata('design:paramtypes', [Reflected], Service);

      expect(new Container().resolve(Service).dep).to.be.instanceOf(Injected);
    });

    it('reports an unregistered string token instead of injecting undefined', () => {
      class Service {
        constructor(@Inject('featureFlags') readonly flags: Record<string, boolean>) {}
      }

      // Silently handing over `{}` is how a missing binding used to hide.
      expect(() => new Container().resolve(Service)).to.throw(UnresolvableDependencyError);
      expect(() => new Container().resolve(Service)).to.throw(/@Inject/);
    });

    it('does not leak tokens between identically-decorated classes', () => {
      class Dep {}
      class First {
        constructor(@Inject(Dep) readonly dep: Dep) {}
      }
      class Second {
        constructor(@Inject(Dep) readonly dep: Dep) {}
        other() {}
      }
      const container = new Container();

      // Copy-on-write in the decorator is what keeps the two token lists
      // independent. Both classes share the Dep singleton, but each resolved
      // its own token list correctly.
      expect(container.resolve(First).dep).to.be.instanceOf(Dep);
      expect(container.resolve(Second).dep).to.be.instanceOf(Dep);
      expect(container.resolve(First).dep).to.equal(container.resolve(Second).dep);
    });

    it('honours a token declared at a later parameter index', () => {
      class Dep {}
      class Service {
        constructor(
          readonly plain: string,
          @Inject(Dep) readonly dep: Dep,
        ) {}
      }
      Reflect.defineMetadata('design:paramtypes', [String, Dep], Service);

      const resolved = new Container().resolve(Service);
      expect(resolved.dep).to.be.instanceOf(Dep);
    });

    it('supplies an intrinsic for a primitive parameter', () => {
      class Service {
        constructor(
          readonly label: string,
          readonly retries: number,
          readonly enabled: boolean,
        ) {}
      }
      Reflect.defineMetadata('design:paramtypes', [String, Number, Boolean], Service);

      // A container should not manufacture `new String('')`.
      const resolved = new Container().resolve(Service);
      expect(resolved.label).to.equal('');
      expect(resolved.retries).to.equal(0);
      expect(resolved.enabled).to.be.false;
    });
  });

  describe('circular dependencies', () => {
    it('reports the full cycle instead of overflowing the stack', () => {
      // A bare A -> B -> A. Each arrow-bodied class erases to no metadata, so
      // the cycle is written explicitly the way the compiler would emit it.
      const A: any = class A {
        constructor(readonly b: any) {}
      };
      const B: any = class B {
        constructor(readonly a: any) {}
      };
      Reflect.defineMetadata('design:paramtypes', [B], A);
      Reflect.defineMetadata('design:paramtypes', [A], B);

      const container = new Container();

      // Previously this recursed until the stack blew up.
      expect(() => container.resolve(A)).to.throw(CircularDependencyError);
      expect(() => container.resolve(A)).to.throw(/CircularDependencyError|circular/i);
    });

    it('names both participants in the cycle message', () => {
      const A: any = class Alpha {
        constructor(readonly b: any) {}
      };
      const B: any = class Beta {
        constructor(readonly a: any) {}
      };
      Reflect.defineMetadata('design:paramtypes', [B], A);
      Reflect.defineMetadata('design:paramtypes', [A], B);

      try {
        new Container().resolve(A);
        expect.fail('should have thrown');
      } catch (error) {
        expect((error as Error).message).to.contain('Alpha');
        expect((error as Error).message).to.contain('Beta');
      }
    });

    it('breaks a cycle when the deferred side does not need the other side', () => {
      // `Right` is declared first so the arrow in `Left` closes over an
      // initialised binding. The cycle is only apparent: `Right` never
      // actually asks for `Left`, so there is nothing to order.
      class Right {
        readonly label = 'right';
      }
      class Left {
        constructor(@Inject(forwardRef(() => Right)) readonly right: Right) {}
      }

      const left = new Container().resolve(Left);
      expect(left.right).to.be.instanceOf(Right);
      expect(left.right.label).to.equal('right');
    });

    it('still reports a mutual eager cycle, since forwardRef cannot order it', () => {
      class Right {
        constructor(readonly left: any) {}
      }
      class Left {
        constructor(@Inject(forwardRef(() => Right)) readonly right: Right) {}
      }
      // `Right` genuinely needs `Left`'s instance, which no lookup order can
      // supply — the container says so rather than looping.
      Reflect.defineMetadata('design:paramtypes', [Left], Right);

      expect(() => new Container().resolve(Left)).to.throw(CircularDependencyError);
    });
  });

  describe('erased parameter types', () => {
    it('fails loudly when a parameter erases to Object', () => {
      class Service {
        constructor(readonly repo: Record<string, unknown>) {}
      }
      // An interface erases to Object; silently building `{}` used to happen.
      Reflect.defineMetadata('design:paramtypes', [Object], Service);

      const container = new Container();
      expect(() => container.resolve(Service)).to.throw(UnresolvableDependencyError);
      expect(() => container.resolve(Service)).to.throw(/erased/);
    });

    it('fails when a parameter has neither metadata nor an @Inject token', () => {
      // A class with a constructor but no decorator at all: the compiler emits
      // nothing, so the container cannot know what was asked for.
      class Service {
        constructor(readonly value: unknown) {}
      }
      expect(() => new Container().resolve(Service)).to.throw(/@Injectable\(\)/);
    });

    it('fails when a decorated provider still lacks metadata for one parameter', () => {
      @Injectable()
      class Service {
        constructor(readonly value: unknown) {}
      }
      // Simulates a parameter whose metadata was stripped.
      Reflect.defineMetadata('design:paramtypes', [Object], Service);
      expect(() => new Container().resolve(Service)).to.throw(UnresolvableDependencyError);
    });
  });

  describe('DependenciesScanner', () => {
    it('registers the graph and exposes the root', async () => {
      @GlandModule({})
      class ChildModule {}
      @GlandModule({ imports: [ChildModule] })
      class RootModule {}

      const scanner = new DependenciesScanner();
      const root = await scanner.scan(RootModule);

      expect(root).to.be.instanceOf(ModuleRef);
      expect(root.token).to.equal('RootModule');
      expect(scanner.modules.size).to.equal(2);
      expect(scanner.container.moduleContainer.getByToken('ChildModule')).to.exist;
    });

    it('describes the root in its debug output', async () => {
      @GlandModule({})
      class NamedModule {}

      // `nameOf` feeds a log line, so a wrong answer shows up as "anonymous"
      // or a raw object in the bootstrap trace.
      const scanner = new DependenciesScanner();
      await scanner.scan(NamedModule);
      expect(scanner['nameOf'](NamedModule)).to.equal('NamedModule');
    });

    it('describes a lazy import without touching the thunk', () => {
      const scanner = new DependenciesScanner();
      expect(scanner['nameOf'](Promise.resolve({ module: class Lazy {} }))).to.equal('<lazy import>');
    });

    it('describes a dynamic module by its wrapped class', () => {
      class Wrapped {}
      const scanner = new DependenciesScanner();
      expect(scanner['nameOf']({ module: Wrapped, channels: [] })).to.equal('Wrapped');
    });

    it('reports progress when a logger is supplied', async () => {
      @GlandModule({})
      class NamedModule {}

      const seen: string[] = [];
      const logger = { child: () => logger, debug: (m: string) => void seen.push(m) } as never;

      // With no logger the debug lines are skipped entirely, which is why the
      // class needs both paths covered.
      await new DependenciesScanner(logger).scan(NamedModule);

      expect(seen.some((m) => m.includes('NamedModule'))).to.be.true;
      expect(seen.some((m) => m.includes('module(s)'))).to.be.true;
      expect(seen).to.contain('- Done.');
    });

    it('stays silent without a logger', async () => {
      @GlandModule({})
      class QuietModule {}
      const root = await new DependenciesScanner().scan(QuietModule);
      expect(root.token).to.equal('QuietModule');
    });
  });

  describe('register', () => {
    it('registers the root module and instantiates it', async () => {
      @GlandModule({ controllers: [], channels: [] })
      class AppModule {
        readonly booted = true;
      }
      const container = new Container();

      const root = await container.register(AppModule);
      expect(root).to.be.instanceOf(ModuleRef);
      expect(root.instance?.booted).to.be.true;
      expect(container.moduleContainer.getByToken('AppModule')).to.equal(root);
    });

    it('registers imported modules transitively', async () => {
      class Dep {}
      @GlandModule({})
      class ChildModule {
        constructor(readonly dep: Dep) {}
      }
      @GlandModule({ imports: [ChildModule] })
      class AppModule {}

      const container = new Container();
      const root = await container.register(AppModule);

      expect(root.imports.size).to.equal(1);
      expect(container.moduleContainer.getByToken('ChildModule')).to.exist;
    });

    it('is idempotent for a module reachable through two parents', async () => {
      @GlandModule({})
      class SharedModule {}
      @GlandModule({ imports: [SharedModule] })
      class LeftModule {}
      @GlandModule({ imports: [SharedModule] })
      class RightModule {}
      @GlandModule({ imports: [LeftModule, RightModule] })
      class AppModule {}

      const container = new Container();
      const root = await container.register(AppModule);

      expect(root.imports.size).to.equal(2);
      // A diamond must converge on one instance, not two.
      expect(container.moduleContainer.getByToken('SharedModule')).to.exist;
      expect(container.moduleContainer.traverse(root)).to.have.lengthOf(4);
    });

    it('registers controllers and channels as singletons', async () => {
      @Channel('db')
      class Database {
        readonly id = Math.random();
        @On('ping')
        ping() {
          return 'pong';
        }
      }
      class Ctrl {
        readonly value = 'x';
      }
      @GlandModule({ controllers: [Ctrl], channels: [Database] })
      class AppModule {}

      const container = new Container();
      const root = await container.register(AppModule);

      expect(root.controllers.size).to.equal(1);
      expect(root.channels.size).to.equal(1);
      expect(root.channels.get(Database)!.getInstance().id).to.equal(container.resolve(Database).id);
    });

    it('merges dynamic module metadata with the class metadata', async () => {
      class Extra {}
      @GlandModule({ channels: [Extra] })
      class BaseModule {}
      @GlandModule({})
      class AppModule {}

      const container = new Container();
      const root = await container.register({ module: AppModule, channels: [Extra] });
      const base = await container.register({ module: BaseModule });

      expect(base.channels.size).to.equal(1);
      expect(root.channels.size).to.equal(1);
    });

    it('awaits a promise-shaped import', async () => {
      @GlandModule({})
      class LazyModule {}
      @GlandModule({ imports: [Promise.resolve({ module: LazyModule })] })
      class AppModule {}

      const container = new Container();
      const root = await container.register(AppModule);

      expect(root.imports.size).to.equal(1);
      expect(container.moduleContainer.getByToken('LazyModule')).to.exist;
    });
  });
});
