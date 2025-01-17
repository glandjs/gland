import { expect } from 'chai';
import { Injectable, Module, Inject, Injector } from '../../../dist/decorator/module';
import { ClassProvider, ExistingProvider, FactoryProvider, ValueProvider } from '../../../dist/common/interfaces';
import sinon from 'sinon';

// Mock Interfaces and Types
interface TestService {
  getMessage(): string;
}
interface ConfigService {
  getConfig(): string;
}

// Mock Classes
@Injectable()
class ConfigServiceImpl implements ConfigService {
  getConfig() {
    return 'TestConfig';
  }
}

@Injectable({ scope: 'singleton' })
class TestServiceImpl implements TestService {
  constructor(@Inject('ConfigService') private configService: ConfigService) {}
  getMessage() {
    return `Message: ${this.configService.getConfig()}`;
  }
}

@Module({
  providers: [
    { provide: 'ConfigService', useClass: ConfigServiceImpl },
    { provide: 'TestService', useClass: TestServiceImpl, scope: 'singleton' },
  ],
  controllers: [],
  imports: [],
})
class AppModule {}

describe('Dependency Injection System', () => {
  let injector: Injector;

  beforeEach(() => {
    injector = new Injector();
  });

  describe('Injector Initialization', () => {
    it('should throw an error if initializing a module without @Module decorator', () => {
      class InvalidModule {}
      expect(() => injector.initializeModule(InvalidModule)).to.throw('The provided class is not a valid module. Ensure it is decorated with @Module.');
    });

    it('should initialize a valid module with dependencies', () => {
      expect(() => injector.initializeModule(AppModule)).to.not.throw();
    });
  });

  describe('Provider Registration', () => {
    it('should register value providers correctly', () => {
      const provider = { provide: 'Config', useValue: { setting: true } };
      injector.register(provider);
      expect(injector.resolve('Config')).to.deep.equal({ setting: true });
    });

    it('should register factory providers correctly', () => {
      const provider = {
        provide: 'FactoryResult',
        useFactory: () => 'FactoryValue',
      };
      injector.register(provider);
      expect(injector.resolve('FactoryResult')).to.equal('FactoryValue');
    });

    it('should register existing providers correctly', () => {
      injector.register({ provide: 'ExistingConfig', useExisting: 'ConfigService' });
      injector.register({ provide: 'ConfigService', useClass: ConfigServiceImpl });
      expect(injector.resolve('ExistingConfig')).to.be.instanceOf(ConfigServiceImpl);
    });

    it('should throw an error for unregistered providers', () => {
      expect(() => injector.resolve('UnregisteredService')).to.throw('No provider found for UnregisteredService');
    });
  });

  describe('Dependency Resolution', () => {
    beforeEach(() => {
      injector.initializeModule(AppModule);
    });

    it('should resolve class dependencies recursively', () => {
      const testService = injector.resolve<TestService>('TestService');
      expect(testService).to.be.instanceOf(TestServiceImpl);
      expect(testService.getMessage()).to.equal('Message: TestConfig');
    });

    it('should maintain singleton scope for providers', () => {
      const service1 = injector.resolve<TestService>('TestService');
      const service2 = injector.resolve<TestService>('TestService');
      expect(service1).to.equal(service2);
    });

    it('should resolve factory dependencies correctly', () => {
      injector.register({
        provide: 'DynamicValue',
        useFactory: () => Math.random(),
      });
      const value1 = injector.resolve('DynamicValue');
      const value2 = injector.resolve('DynamicValue');
      expect(value1).to.not.equal(value2);
    });

    it('should throw an error for circular dependencies', () => {
      @Injectable()
      class CircularServiceA {
        constructor(@Inject('CircularServiceB') private b: any) {}
      }

      @Injectable()
      class CircularServiceB {
        constructor(@Inject('CircularServiceA') private a: any) {}
      }

      @Module({
        providers: [
          { provide: 'CircularServiceA', useClass: CircularServiceA },
          { provide: 'CircularServiceB', useClass: CircularServiceB },
        ],
      })
      class CircularModule {}

      injector.initializeModule(CircularModule);

      expect(() => injector.resolve('CircularServiceA')).to.throw();
    });
  });
});

describe('Injector', () => {
  let injector: Injector;

  beforeEach(() => {
    injector = new Injector();
  });

  describe('resolve', () => {
    it('should throw an error if no provider is found for the token', () => {
      const token = 'NonExistentToken';
      expect(() => injector.resolve(token)).to.throw(`No provider found for NonExistentToken`);
    });

    it('should resolve a class provider with singleton scope', () => {
      class TestClass {}
      const provider: ClassProvider = { provide: 'TestClass', useClass: TestClass, scope: 'singleton' };
      injector.register(provider);

      const instance1 = injector.resolve<TestClass>('TestClass');
      const instance2 = injector.resolve<TestClass>('TestClass');

      expect(instance1).to.be.instanceOf(TestClass);
      expect(instance1).to.equal(instance2); // Singleton instances are the same
    });

    it('should resolve a class provider with transient scope', () => {
      class TestClass {}
      const provider: ClassProvider = { provide: 'TestClass', useClass: TestClass, scope: 'transient' };
      injector.register(provider);

      const instance1 = injector.resolve<TestClass>('TestClass');
      const instance2 = injector.resolve<TestClass>('TestClass');

      expect(instance1).to.be.instanceOf(TestClass);
      expect(instance1).to.not.equal(instance2); // Transient instances are different
    });

    it('should resolve a value provider', () => {
      const provider: ValueProvider = { provide: 'ValueToken', useValue: 'TestValue' };
      injector.register(provider);

      const value = injector.resolve<string>('ValueToken');
      expect(value).to.equal('TestValue');
    });

    it('should resolve a factory provider', () => {
      const factoryFn = sinon.stub().returns('FactoryValue');
      const provider: FactoryProvider = { provide: 'FactoryToken', useFactory: factoryFn };
      injector.register(provider);

      const value = injector.resolve<string>('FactoryToken');
      expect(value).to.equal('FactoryValue');
      expect(factoryFn.calledOnce).to.be.true;
    });

    it('should inject dependencies into a factory provider', () => {
      const dependencyToken = 'DependencyToken';
      const factoryFn = sinon.stub().callsFake((dep) => `FactoryWith${dep}`);
      const dependencyProvider: ValueProvider = { provide: dependencyToken, useValue: 'DependencyValue' };
      const provider: FactoryProvider = { provide: 'FactoryToken', useFactory: factoryFn, inject: [dependencyToken] };

      injector.register(dependencyProvider);
      injector.register(provider);

      const value = injector.resolve<string>('FactoryToken');
      expect(value).to.equal('FactoryWithDependencyValue');
      expect(factoryFn.calledOnce).to.be.true;
    });

    it('should resolve an existing provider alias', () => {
      const originalProvider: ValueProvider = { provide: 'OriginalToken', useValue: 'OriginalValue' };
      const aliasProvider: ExistingProvider = { provide: 'AliasToken', useExisting: 'OriginalToken' };

      injector.register(originalProvider);
      injector.register(aliasProvider);

      const value = injector.resolve<string>('AliasToken');
      expect(value).to.equal('OriginalValue');
    });
  });

  describe('register', () => {
    it('should allow registering multiple types of providers', () => {
      class TestClass {}
      const classProvider: ClassProvider = { provide: 'ClassToken', useClass: TestClass, scope: 'singleton' };
      const valueProvider: ValueProvider = { provide: 'ValueToken', useValue: 'Value' };
      const factoryProvider: FactoryProvider = { provide: 'FactoryToken', useFactory: () => 'FactoryValue' };

      expect(() => {
        injector.register(classProvider);
        injector.register(valueProvider);
        injector.register(factoryProvider);
      }).to.not.throw();
    });

    it('should override existing providers with the same token', () => {
      const provider1: ValueProvider = { provide: 'Token', useValue: 'Value1' };
      const provider2: ValueProvider = { provide: 'Token', useValue: 'Value2' };

      injector.register(provider1);
      injector.register(provider2);

      const value = injector.resolve<string>('Token');
      expect(value).to.equal('Value2');
    });
  });

  describe('initializeModule', () => {
    it('should throw an error if the provided module is not decorated with @Module', () => {
      class NonModule {}
      expect(() => injector.initializeModule(NonModule)).to.throw('The provided class is not a valid module. Ensure it is decorated with @Module.');
    });

    it('should initialize a module and its dependencies', () => {
      @Injectable()
      class ServiceA {}

      @Injectable()
      class ServiceB {
        constructor(@Inject(ServiceA) public serviceA: ServiceA) {}
      }

      @Module({
        providers: [
          { provide: ServiceA, useClass: ServiceA },
          { provide: ServiceB, useClass: ServiceB },
        ],
      })
      class AppModule {}

      injector.initializeModule(AppModule);

      const serviceB = injector.resolve<ServiceB>(ServiceB);
      expect(serviceB).to.be.instanceOf(ServiceB);
      expect(serviceB.serviceA).to.be.instanceOf(ServiceA);
    });

    it('should handle nested module imports', () => {
      @Injectable()
      class ServiceA {}

      @Module({ providers: [{ provide: ServiceA, useClass: ServiceA }] })
      class ModuleA {}

      @Module({ imports: [ModuleA] })
      class RootModule {}

      injector.initializeModule(RootModule);

      const serviceA = injector.resolve<ServiceA>(ServiceA);

      expect(serviceA).to.be.instanceOf(ServiceA);
    });
  });
});

describe('Injector', () => {
  let injector: Injector;

  beforeEach(() => {
    injector = new Injector();
  });

  describe('resolve', () => {
    it('should resolve a singleton class provider', () => {
      class TestService {}
      const provider: ClassProvider = { provide: 'TestService', useClass: TestService, scope: 'singleton' };
      injector.register(provider);
      const instance1 = injector.resolve('TestService');
      const instance2 = injector.resolve('TestService');
      expect(instance1).to.be.instanceOf(TestService);
      expect(instance1).to.equal(instance2); // Singleton should return the same instance
    });
    it('should resolve a transient class provider', () => {
      class TestService {}
      const provider: ClassProvider = { provide: 'TestService', useClass: TestService, scope: 'transient' };
      injector.register(provider);
      const instance1 = injector.resolve('TestService');
      const instance2 = injector.resolve('TestService');
      expect(instance1).to.be.instanceOf(TestService);
      expect(instance1).to.not.equal(instance2); // Transient should return a new instance each time
    });
    it('should resolve a value provider', () => {
      const provider: ValueProvider = { provide: 'Config', useValue: { key: 'value' } };
      injector.register(provider);
      const resolvedValue = injector.resolve('Config');
      expect(resolvedValue).to.deep.equal({ key: 'value' });
    });
    it('should resolve a factory provider with dependencies', () => {
      class Dependency {}
      const dependencyProvider: ClassProvider = { provide: 'Dependency', useClass: Dependency };
      injector.register(dependencyProvider);
      const factory: FactoryProvider = {
        provide: 'TestFactory',
        useFactory: (dep: Dependency) => ({ instance: dep }),
        inject: ['Dependency'],
      };
      injector.register(factory);
      const resolvedValue = injector.resolve('TestFactory');
      expect(resolvedValue).to.have.property('instance').that.is.instanceOf(Dependency);
    });
    it('should resolve an existing provider', () => {
      class Original {}
      const originalProvider: ClassProvider = { provide: 'Original', useClass: Original, scope: 'singleton' };
      injector.register(originalProvider);
      const aliasProvider: ExistingProvider = { provide: 'Alias', useExisting: 'Original' };
      injector.register(aliasProvider);
      const aliasInstance = injector.resolve('Alias');
      const originalInstance = injector.resolve('Original');
      expect(aliasInstance).to.equal(originalInstance);
    });
    it('should throw an error if no provider is found', () => {
      expect(() => injector.resolve('NonExistent')).to.throw('No provider found for NonExistent');
    });
  });

  describe('register', () => {
    it('should register and resolve a provider correctly', () => {
      class TestService {}
      const provider: ClassProvider = { provide: 'TestService', useClass: TestService };
      injector.register(provider);

      const instance = injector.resolve('TestService');

      expect(instance).to.be.instanceOf(TestService);
    });
  });

  describe('Edge Cases', () => {
    it('should throw an error for invalid provider type', () => {
      const invalidProvider = { provide: 'InvalidProvider' };

      expect(() => injector.register(invalidProvider as any)).to.throw('Invalid provider type for InvalidProvider');
    });

    it('should handle asynchronous factory providers', async () => {
      const factory: FactoryProvider = {
        provide: 'AsyncFactory',
        useFactory: async () => 'AsyncValue',
      };
      injector.register(factory);

      const result = await injector.resolve('AsyncFactory');
      expect(result).to.equal('AsyncValue');
    });
  });
});
