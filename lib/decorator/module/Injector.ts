import { ModuleMetadataKeys, RouterMetadataKeys } from '../../common/enums';
import { ClassProvider, ValueProvider, FactoryProvider, ExistingProvider, Constructor, RouteDefinition, ModuleMetadata, ImportableModule, DynamicModule } from '../../common/interfaces';
import { InjectionToken, Provider } from '../../common/types';
import Reflector from '../../metadata';

export class Injector {
  private container: Map<InjectionToken, any> = new Map();
  private scopeContainer: Map<InjectionToken, any> = new Map();

  resolve<T>(token: InjectionToken<T>): T {
    if (this.scopeContainer.has(token)) {
      return this.scopeContainer.get(token);
    }

    const provider = this.container.get(token);
    if (!provider) {
      throw new Error(`No provider found for ${String(token)}`);
    }

    if (this.isClassProvider(provider)) {
      const instance = this.scopeContainer.has(token) ? this.scopeContainer.get(token) : this.instantiate(provider.useClass);

      if (!this.scopeContainer.has(token) && provider.scope !== 'transient') {
        this.scopeContainer.set(token, instance);
      }
      return instance;
    }

    if (this.isValueProvider(provider)) {
      return provider.useValue;
    }

    if (this.isFactoryProvider(provider)) {
      return this.instantiateFactory(provider);
    }

    if (this.isExistingProvider(provider)) {
      const existingInstance = this.resolve(provider.useExisting);
      if (!this.scopeContainer.has(token)) {
        this.scopeContainer.set(token, existingInstance);
      }
      return existingInstance;
    }

    throw new Error(`Invalid provider type for ${String(token)}`);
  }

  private instantiate<T>(ctor: Constructor<T>): T {
    const dependencies = Reflector.get(ModuleMetadataKeys.PARAM_DEPENDENCIES, ctor) ?? [];
    const resolvedDeps = dependencies.map((dep: any) => this.resolve(dep.param));
    return new ctor(...resolvedDeps);
  }

  private instantiateFactory<T>(provider: FactoryProvider<T>): T | Promise<T> {
    const dependencies = provider.inject?.map((dep) => this.resolve(dep));
    return provider.useFactory(...(dependencies ?? []));
  }

  register(provider: Provider) {
    if (!this.isClassProvider(provider) && !this.isValueProvider(provider) && !this.isFactoryProvider(provider) && !this.isExistingProvider(provider)) {
      throw new Error(`Invalid provider type for ${String((provider as any).provide)}`);
    }
    this.container.set(provider.provide, provider);
  }

  private isClassProvider(provider: Provider): provider is ClassProvider {
    return (provider as ClassProvider).useClass !== undefined;
  }

  private isValueProvider(provider: Provider): provider is ValueProvider {
    return (provider as ValueProvider).useValue !== undefined;
  }

  private isFactoryProvider(provider: Provider): provider is FactoryProvider {
    return (provider as FactoryProvider).useFactory !== undefined;
  }

  private isExistingProvider(provider: Provider): provider is ExistingProvider {
    return (provider as ExistingProvider).useExisting !== undefined;
  }
  private registerModuleDependencies(moduleMetadata: ModuleMetadata, parentModule?: Constructor<any>) {
    (moduleMetadata.providers ?? []).forEach((provider: Provider) => {
      this.register(provider);
    });

    const exportedTokens = moduleMetadata.exports ?? [];
    exportedTokens.forEach((token) => {
      const provider = this.container.get(token);
      if (!provider) {
        throw new Error(`Cannot export unknown provider: ${String(token)}`);
      }

      this.container.set(token, provider);
    });

    (moduleMetadata.imports ?? []).forEach((importedModule: ImportableModule) => {
      const importedMetadata = this.getModuleMetadata(importedModule);
      if (!importedMetadata) {
        throw new Error(`Invalid imported module: ${String(importedModule)}`);
      }

      this.registerModuleDependencies(importedMetadata);

      (importedMetadata.exports ?? []).forEach((exportedToken) => {
        const provider = this.resolve(exportedToken);
        this.container.set(exportedToken, provider);
      });
    });
  }

  private getModuleMetadata(module: ImportableModule): ModuleMetadata | null {
    if ('module' in module) {
      return Reflector.get(ModuleMetadataKeys.MODULE, module.module);
    }
    return Reflector.get(ModuleMetadataKeys.MODULE, module);
  }

  private createControllerInstance(controller: Constructor<any>) {
    const dependencies = Reflector.get(ModuleMetadataKeys.PARAM_DEPENDENCIES, controller) ?? [];
    const resolvedDeps = dependencies.map((dep: any) => this.resolve(dep?.param));
    return new controller(...resolvedDeps);
  }
  public initializeModule(rootModule: Constructor<any>) {
    const moduleMetadata = Reflector.get(ModuleMetadataKeys.MODULE, rootModule);

    if (!moduleMetadata) {
      throw new Error(`The provided class is not a valid module. Ensure it is decorated with @Module.`);
    }
    this.registerModuleDependencies(moduleMetadata);

    const controllers = moduleMetadata.controllers ?? [];
    controllers.forEach((controller: Constructor<any>) => {
      const controllerPrefix = Reflector.get(RouterMetadataKeys.CONTROLLER_PREFIX, controller);
      const routes = Reflector.get(RouterMetadataKeys.ROUTES, controller) ?? [];
      const controllerInstance = this.createControllerInstance(controller);
      routes.forEach((route: RouteDefinition) => {
        route.path = `${controllerPrefix}${route.path}`;
        route.action = route.action.bind(controllerInstance);
      });
    });
  }
}
