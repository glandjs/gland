import { expect } from 'chai';
import { Container, Injector, LazyModuleLoader, ModuleCompiler, ModuleTokenFactory } from '../../../packages/core/di';
import { describe } from 'mocha';
import { DynamicModule, FactoryProvider, Inject, Injectable, Module, MODULE_METADATA, Provider, Scope, ValueProvider } from '@gland/common';
import { ScopedContainer } from '@gland/core/di/container/scoped-container';
import sinon from 'sinon';
describe('@gland/core/di', () => {
  let moduleTokenFactory: ModuleTokenFactory;
  let container: Container;
  let injector: Injector;
  let lazyLoader: LazyModuleLoader;

  before(() => {
    moduleTokenFactory = new ModuleTokenFactory('deep-hash');
    container = new Container(moduleTokenFactory);
    injector = new Injector(container);
    lazyLoader = new LazyModuleLoader(container, injector, new ModuleCompiler(moduleTokenFactory));
  });

  beforeEach(() => {
    container.clear();
    lazyLoader['loadedModules'].clear();
    injector['scopedContainers'].clear();
    injector['resolvingTokens'].clear();
  });

  describe('ModuleTokenFactory', () => {
    it('should generate consistent tokens for same metadata', () => {
      const metadata = {
        controllers: [class TestController {}],
        providers: [class TestService {}],
      };

      const token1 = moduleTokenFactory.create(metadata);
      const token2 = moduleTokenFactory.create(metadata);
      expect(token1).to.equal(token2);
    });

    it('should generate equal tokens for different metadata', () => {
      const metadata1 = { providers: [class ServiceA {}] };
      const metadata2 = { providers: [class ServiceB {}] };
      const token1 = moduleTokenFactory.create(metadata1);
      const token2 = moduleTokenFactory.create(metadata2);
      expect(token1).to.equal(token2);
    });
  });

  describe('Container', () => {
    it('should register module and convert controllers to providers', () => {
      @Module({ controllers: [class TestController {}] })
      class TestModule {}

      const token = container.addModule(TestModule);
      const module = container.getModule(token)!;

      expect(module.providers).to.have.length(1);
      expect(module.providers![0]).to.have.property('provide', module.controllers![0]);
    });

    it('should not register duplicate modules', () => {
      @Module({ providers: [class TestService {}] })
      class TestModule {}

      const token1 = container.addModule(TestModule);
      const token2 = container.addModule(TestModule);
      expect(token1).to.equal(token2);
      expect(container['modules'].size).to.equal(1);
    });
  });

  describe('Injector', () => {
    it('should resolve class dependencies', async () => {
      @Injectable()
      class TestService {
        getMessage() {
          return 'Hello';
        }
      }

      @Injectable()
      class TestController {
        constructor(@Inject(TestService) public service: TestService) {}
      }

      @Module({
        controllers: [TestController],
        providers: [TestService],
      })
      class TestModule {}

      const token = container.addModule(TestModule);
      const instance = await injector.resolve(TestController, token);

      expect(instance.service).to.be.instanceOf(TestService);
      expect(instance.service.getMessage()).to.equal('Hello');
    });

    it('should handle circular dependencies', async () => {
      @Injectable()
      class ServiceA {
        constructor(@Inject('ServiceB') public b: any) {}
      }

      @Injectable()
      class ServiceB {
        constructor(@Inject('ServiceA') public a: any) {}
      }

      @Module({
        providers: [
          { provide: 'ServiceA', useClass: ServiceA },
          { provide: 'ServiceB', useClass: ServiceB },
        ],
      })
      class TestModule {}

      const token = container.addModule(TestModule);

      try {
        await injector.resolve('ServiceA', token);
        expect.fail('Should throw circular dependency error');
      } catch (e) {
        expect(e.message).to.include('Circular dependency detected');
      }
    });
  });

  describe('LazyModuleLoader', () => {
    it('should load modules on demand', async () => {
      @Module({ providers: [class LazyService {}] })
      class LazyModule {}

      const { token } = await lazyLoader.loadModule(LazyModule);
      expect(container.getModule(token)).to.exist;
    });

    it('should cache loaded modules', async () => {
      @Module({ providers: [class CachedService {}] })
      class CachedModule {}

      const firstLoad = await lazyLoader.loadModule(CachedModule);
      const secondLoad = await lazyLoader.loadModule(CachedModule);

      expect(firstLoad.token).to.equal(secondLoad.token);
      expect(lazyLoader['loadedModules'].size).to.equal(1);
    });
  });

  describe('ScopedContainer', () => {
    it('should maintain separate instances per scope', async () => {
      @Injectable()
      class ScopedService {}

      @Module({ providers: [ScopedService] })
      class ScopedModule {}

      const token = container.addModule(ScopedModule);

      const instance1 = await injector.resolve(ScopedService, token);
      const instance2 = await injector.resolve(ScopedService, token);

      expect(instance1).to.equal(instance2); // Same scope

      const newScope = 'new-scope';
      const scopedContainer = new ScopedContainer(container, newScope);
      scopedContainer.setInstance(ScopedService, new ScopedService());

      expect(scopedContainer.getInstance(ScopedService)).not.to.equal(instance1);
    });
  });

  describe('Full Integration', () => {
    @Injectable()
    class DatabaseService {
      connect() {
        return 'Connected';
      }
    }

    @Injectable()
    class UserService {
      constructor(@Inject(DatabaseService) private db: DatabaseService) {}
      getUsers() {
        return `${this.db.connect()}: Users`;
      }
    }

    @Injectable()
    class UserController {
      constructor(@Inject(UserService) public service: UserService) {}
      handle() {
        return this.service.getUsers();
      }
    }

    @Module({
      controllers: [UserController],
      providers: [UserService, DatabaseService],
      exports: [UserService],
    })
    class AppModule {}

    it('should resolve complete dependency tree', async () => {
      const token = container.addModule(AppModule);
      const controller = await injector.resolve(UserController, token);

      expect(controller.handle()).to.equal('Connected: Users');
    });

    it('should handle lazy loaded modules', async () => {
      const { token } = await lazyLoader.loadModule(AppModule);
      const controller = await injector.resolve(UserController, token);

      expect(controller).to.be.instanceOf(UserController);
      expect(controller.service).to.be.instanceOf(UserService);
    });
  });

  describe('Module Dependency Injection', () => {
    it('should resolve nested dependencies correctly', async () => {
      @Injectable()
      class NestedService {
        getValue() {
          return 'Nested Service Value';
        }
      }

      @Injectable()
      class ParentService {
        constructor(@Inject(NestedService) private nestedService: NestedService) {}

        getMessage() {
          return `Parent with ${this.nestedService.getValue()}`;
        }
      }

      @Module({
        providers: [ParentService, NestedService],
      })
      class ParentModule {}

      const token = container.addModule(ParentModule);
      const parentService = await injector.resolve(ParentService, token);

      expect(parentService.getMessage()).to.equal('Parent with Nested Service Value');
    });
  });

  describe('Scope Handling', () => {
    it('should respect singleton scope', async () => {
      @Injectable({ scope: { scope: 'SINGLETON' } })
      class SingletonService {
        constructor() {
          this.id = Math.random().toString();
        }
        id: string;
      }

      @Module({
        providers: [SingletonService],
      })
      class SingletonModule {}

      const token = container.addModule(SingletonModule);
      const instance1 = await injector.resolve(SingletonService, token);
      const instance2 = await injector.resolve(SingletonService, token);

      expect(instance1.id).to.equal(instance2.id); // Singleton scope should be the same
    });

    it('should respect scoped services', async () => {
      @Injectable({ scope: { scope: 'REQUEST' } })
      class ScopedService {
        constructor() {
          this.id = Math.random().toString();
        }
        id: string;
      }

      @Module({
        providers: [ScopedService],
      })
      class ScopedModule {}

      const token = container.addModule(ScopedModule);
      const instance1 = await injector.resolve(ScopedService, token);
      const instance2 = await injector.resolve(ScopedService, token);

      expect(instance1.id).to.equal(instance2.id);
    });
  });

  describe('Lazy Module Loading', () => {
    it('should lazily load modules when required', async () => {
      @Injectable()
      class LazyService {}
      @Module({
        providers: [LazyService],
      })
      class LazyModule {}

      const { token } = await lazyLoader.loadModule(LazyModule);
      const lazyService = await injector.resolve(LazyService, token);

      expect(lazyService).to.be.instanceOf(LazyService);
    });

    it('should cache loaded modules and not load them multiple times', async () => {
      @Module({
        providers: [class CachedService {}],
      })
      class CachedModule {}

      const firstLoad = await lazyLoader.loadModule(CachedModule);
      const secondLoad = await lazyLoader.loadModule(CachedModule);

      expect(firstLoad.token).to.equal(secondLoad.token);
      expect(lazyLoader['loadedModules'].size).to.equal(1);
    });
  });

  describe('Other Cases', () => {
    it('should throw for unregistered providers', async () => {
      try {
        await injector.resolve('UnregisteredService', 'any-token');
        expect.fail('Should throw provider not found error');
      } catch (e) {
        expect(e.message).to.include('Provider not found');
      }
    });

    it('should handle empty modules', () => {
      @Module({})
      class EmptyModule {}

      try {
        container.addModule(EmptyModule);
        expect.fail('Should throw validation error');
      } catch (e) {
        expect(e.message).to.include('Module metadata not found for EmptyModule');
      }
    });

    it('should resolve factory providers', async () => {
      const config = { env: 'test' };
      const factory = {
        provide: 'CONFIG',
        useFactory: () => config,
      };

      @Module({ providers: [factory] })
      class FactoryModule {}

      const token = container.addModule(FactoryModule);
      const result = await injector.resolve('CONFIG', token);

      expect(result).to.equal(config);
    });
  });

  describe('Dynamic Modules', () => {
    it('should handle dynamic modules with global providers', async () => {
      class DynamicService {}
      const dynamicModule: DynamicModule = {
        module: class DynamicModule {},
        providers: [DynamicService],
        exports: [DynamicService],
        global: true,
      };

      const token = container.addModule(dynamicModule);
      const globalProvider = container.getProviderByToken(DynamicService);

      expect(globalProvider).to.exist;
      expect(container['globalProviders'].size).to.equal(1);
    });
    it('should allow dynamic modules with global exports', async () => {
      @Injectable()
      class GlobalService {
        getMessage() {
          return 'Global Service';
        }
      }

      @Module({
        providers: [GlobalService],
        exports: [GlobalService],
      })
      class GlobalModule {}

      @Module({
        imports: [GlobalModule],
      })
      class AppModule {}

      const token = container.addModule(AppModule);
      const globalService = await injector.resolve(GlobalService, token);

      expect(globalService.getMessage()).to.equal('Global Service');
    });
  });

  describe('Custom Providers', () => {
    it('should resolve factory providers with dependencies', async () => {
      @Injectable()
      class ConnectionService {
        connect() {
          return 'connected';
        }
      }

      const factoryProvider: FactoryProvider<string> = {
        provide: 'CONNECTION_STRING',
        useFactory: (conn: ConnectionService) => conn.connect(),
        inject: [ConnectionService],
      };

      @Module({ providers: [ConnectionService, factoryProvider] })
      class FactoryModule {}

      const token = container.addModule(FactoryModule);
      const result = await injector.resolve('CONNECTION_STRING', token);

      expect(result).to.equal('connected');
    });

    it('should resolve value providers', async () => {
      const valueProvider: ValueProvider<number> = {
        provide: 'API_TIMEOUT',
        useValue: 3000,
      };

      @Module({ providers: [valueProvider] })
      class ValueModule {}

      const token = container.addModule(ValueModule);
      const timeout = await injector.resolve('API_TIMEOUT', token);

      expect(timeout).to.equal(3000);
    });

    it('should resolve existing providers', async () => {
      class AbstractService {}
      class ConcreteService extends AbstractService {}

      const providers: Provider<any>[] = [ConcreteService, { provide: AbstractService, useExisting: ConcreteService }];

      @Module({ providers })
      class ExistingModule {}

      const token = container.addModule(ExistingModule);
      const instance1 = await injector.resolve(ConcreteService, token);
      const instance2 = await injector.resolve(AbstractService, token);

      expect(instance1).to.equal(instance2);
    });
  });

  describe('Metadata Validation', () => {
    it('should attach scope metadata with @Injectable decorator', () => {
      @Injectable({ scope: { scope: Scope.REQUEST } })
      class ScopedService {}

      const scopeOptions = Reflect.getMetadata(MODULE_METADATA.SCOPE_OPTIONS_METADATA, ScopedService);
      expect(scopeOptions).to.deep.equal({ scope: { scope: Scope.REQUEST } });
    });
  });

  describe('Module Exports', () => {
    it('should make exported providers available to importing modules', async () => {
      class SharedService {}
      @Module({
        providers: [SharedService],
        exports: [SharedService],
      })
      class SharedModule {}

      @Module({
        imports: [SharedModule],
      })
      class AppModule {}

      const appToken = container.addModule(AppModule);

      const sharedService = await injector.resolve(SharedService, appToken);

      expect(sharedService).to.be.instanceOf(SharedService);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for missing required dependencies', async () => {
      @Injectable()
      class DependentService {
        constructor(@Inject('MissingDep') public dep: any) {}
      }

      @Module({ providers: [DependentService] })
      class ErrorModule {}

      const token = container.addModule(ErrorModule);

      try {
        await injector.resolve(DependentService, token);
        expect.fail('Should throw dependency error');
      } catch (e) {
        expect(e.message).to.include('Provider not found');
      }
    });

    it('should detect invalid provider configurations', () => {
      const invalidProvider = { provide: 'INVALID', useUnknown: {} } as unknown as Provider<any>;

      try {
        @Module({ providers: [invalidProvider] })
        class InvalidModule {}

        container.addModule(InvalidModule);
        expect.fail('Should throw validation error');
      } catch (e) {
        expect(e.message).to.include('Invalid provider configuration');
      }
    });
  });
  describe('Full Dependency Resolution', () => {
    it('should resolve controllers with full dependency trees', async () => {
      @Injectable()
      class DatabaseService {
        connect() {
          return 'Connected to DB';
        }
      }

      @Injectable()
      class UserService {
        constructor(@Inject(DatabaseService) private db: DatabaseService) {}
        getUsers() {
          return `${this.db.connect()}: Users`;
        }
      }

      @Injectable()
      class UserController {
        constructor(@Inject(UserService) public service: UserService) {}
        handle() {
          return this.service.getUsers();
        }
      }

      @Module({
        controllers: [UserController],
        providers: [UserService, DatabaseService],
      })
      class AppModule {}

      const token = container.addModule(AppModule);
      const controller = await injector.resolve(UserController, token);

      expect(controller.handle()).to.equal('Connected to DB: Users');
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call async initialization providers', async () => {
      const initSpy = sinon.spy();

      @Injectable()
      class AsyncService {
        async onModuleInit() {
          initSpy();
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      @Module({ providers: [AsyncService] })
      class LifecycleModule {}

      const token = container.addModule(LifecycleModule);
      const result = await injector.resolve(AsyncService, token);
      await result.onModuleInit();
      expect(initSpy.called).to.be.true;
    });
  });

  describe('Module Re-Export', () => {
    it('should allow re-exporting modules', async () => {
      class CoreService {}
      @Module({
        providers: [CoreService],
        exports: [CoreService],
      })
      class CoreModule {}

      @Module({
        imports: [CoreModule],
        exports: [CoreModule],
      })
      class AppModule {}

      const appToken = container.addModule(AppModule);

      const coreService = await injector.resolve(CoreService, appToken);
      expect(coreService).to.be.instanceOf(CoreService);
    });
  });

  describe('Provider Scopes', () => {
    it('should handle transient scoped providers', async () => {
      @Injectable({ scope: { scope: Scope.TRANSIENT } })
      class TransientService {}

      @Module({ providers: [TransientService] })
      class TransientModule {}

      const token = container.addModule(TransientModule);

      const instance1 = await injector.resolve(TransientService, token);
      const instance2 = await injector.resolve(TransientService, token);
      expect(instance1).to.equal(instance2);
    });

    it('should handle request-scoped providers', async () => {
      @Injectable({ scope: { scope: Scope.REQUEST } })
      class RequestScopedService {}

      @Module({ providers: [RequestScopedService] })
      class RequestModule {}

      const token = container.addModule(RequestModule);

      const instance1 = await injector.resolve(RequestScopedService, token);
      const instance2 = await injector.resolve(RequestScopedService, token);

      expect(instance1).to.equal(instance2);

      const instance3 = await injector.resolve(RequestScopedService, 'new-request');

      expect(instance3).not.to.equal(instance1);
    });
  });

  describe('Property Injection', () => {
    it('should inject properties with @Inject decorator', async () => {
      @Injectable()
      class ConfigService {
        getConfig() {
          return { env: 'test' };
        }
      }

      @Injectable()
      class AppService {
        @Inject(ConfigService)
        private config!: ConfigService;

        getConfig() {
          return this.config.getConfig();
        }
      }

      @Module({ providers: [AppService, ConfigService] })
      class PropertyModule {}

      const token = container.addModule(PropertyModule);
      const service = await injector.resolve(AppService, token);

      expect(service.getConfig()).to.deep.equal({ env: 'test' });
    });
  });
});
