import { ModuleMetadataKeys } from '../../common/enums';
import { ClassProvider, ValueProvider, FactoryProvider, ExistingProvider, Constructor } from '../../common/interfaces';
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
      const instance = this.instantiate(provider.useClass);

      if (provider.scope === 'singleton') {
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
      return this.resolve(provider.useExisting);
    }

    throw new Error(`Invalid provider type for ${String(token)}`);
  }

  private instantiate<T>(ctor: Constructor<T>): T {
    const dependencies = Reflector.get(ModuleMetadataKeys.PARAM_DEPENDENCIES, ctor) || [];
    const resolvedDeps = dependencies.map((dep: any) => this.resolve(dep.param));
    return new ctor(...resolvedDeps);
  }

  private instantiateFactory<T>(provider: FactoryProvider<T>): T | Promise<T> {
    const dependencies = provider.inject?.map((dep) => this.resolve(dep));
    return provider.useFactory(...(dependencies || []));
  }

  register(provider: Provider) {
    if (this.isClassProvider(provider)) {
      this.container.set(provider.provide, provider);
    } else if (this.isValueProvider(provider)) {
      this.container.set(provider.provide, provider);
    } else if (this.isFactoryProvider(provider)) {
      this.container.set(provider.provide, provider);
    } else if (this.isExistingProvider(provider)) {
      this.container.set(provider.provide, provider);
    }
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
}
