import { ClassProvider, Constructor, FactoryProvider, InjectionToken, MODULE_METADATA, Provider } from '@gland/common';
import { isClassProvider, isConstructorProvider, isExistingProvider, isFactoryProvider, isValueProvider } from '@gland/core/utils';
import { ScopedContainer } from '../container/scoped-container';
import { Container } from '../container/container';

export class Injector {
  private readonly scopedContainers = new Map<string, ScopedContainer>();
  private readonly resolvingTokens: Set<string> = new Set();

  constructor(private readonly container: Container) {}

  async resolve<T>(token: InjectionToken<T>, moduleToken: string): Promise<T> {
    const scopedContainer = this.getScopedContainer(moduleToken);

    if (scopedContainer.hasInstance(token)) {
      return scopedContainer.getInstance(token)!;
    }

    const provider = this.container.getProviderByToken(token);
    if (!provider) {
      throw new Error(`Provider not found for token: ${token.toString()}. Ensure it is registered in the container.`);
    }

    if (this.resolvingTokens.has(token.toString())) {
      throw new Error(`Circular dependency detected for token: ${token.toString()}`);
    }
    this.resolvingTokens.add(token.toString());

    try {
      const instance = await this.instantiateProvider(provider, moduleToken);
      scopedContainer.setInstance(token, instance);
      return instance;
    } finally {
      this.resolvingTokens.delete(token.toString());
    }
  }

  private async instantiateProvider<T>(provider: Provider<T>, moduleToken: string): Promise<T> {
    if (isConstructorProvider(provider)) {
      return this.instantiateClass({ provide: provider, useClass: provider }, moduleToken);
    }
    if (isClassProvider(provider)) {
      return this.instantiateClass(provider, moduleToken);
    }
    if (isFactoryProvider(provider)) {
      return this.instantiateFactory(provider, moduleToken);
    }
    if (isValueProvider(provider)) {
      return provider.useValue;
    }
    if (isExistingProvider(provider)) {
      return this.resolve(provider.useExisting, moduleToken);
    }
    throw new Error(`Invalid provider type: ${JSON.stringify(provider)}`);
  }

  private async instantiateClass<T>(provider: ClassProvider<T>, moduleToken: string): Promise<T> {
    const dependencies = await this.resolveConstructorDependencies(provider.useClass, moduleToken);

    const instance = new provider.useClass(...dependencies);

    const propertyDeps: Array<{ key: string | symbol; token: InjectionToken<T> }> = Reflect.getMetadata(MODULE_METADATA.PROPERTY_DEPENDENCIES_METADATA, provider.useClass) || [];

    for (const { key, token } of propertyDeps) {
      instance[key] = await this.resolve(token, moduleToken);
    }

    return instance;
  }

  private async instantiateFactory<T>(provider: FactoryProvider<T>, moduleToken: string): Promise<T> {
    const dependencies = await Promise.all((provider.inject ?? []).map((token) => this.resolve(token, moduleToken)));
    return provider.useFactory(...dependencies);
  }

  private async resolveConstructorDependencies<T>(constructor: Constructor<T>, moduleToken: string): Promise<any[]> {
    const params = Reflect.getMetadata(MODULE_METADATA.PARAM_DEPENDENCIES_METADATA, constructor) ?? [];

    return Promise.all(
      params.map((param: { index: number; token: InjectionToken<T> }) => {
        return this.resolve(param.token, moduleToken);
      }),
    );
  }

  private getScopedContainer(moduleToken: string): ScopedContainer {
    if (!this.scopedContainers.has(moduleToken)) {
      this.scopedContainers.set(moduleToken, new ScopedContainer(this.container, moduleToken));
    }
    return this.scopedContainers.get(moduleToken)!;
  }
}
