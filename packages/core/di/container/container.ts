import { InjectionToken, ModuleMetadata, ModuleType, Provider } from '@gland/common';
import { ModuleTokenFactory } from '../opaque-key-factory';
import { CompiledModule, ModuleCompiler } from '../compiler';

export class Container {
  private readonly modules = new Map<string, ModuleMetadata<any>>();
  private readonly globalProviders = new Map<InjectionToken<any>, Provider<any>>();
  private readonly providerTokenMap = new Map<InjectionToken<any>, string>();
  private readonly moduleCompiler: ModuleCompiler;

  constructor(readonly moduleTokenFactory: ModuleTokenFactory) {
    this.moduleCompiler = new ModuleCompiler(moduleTokenFactory);
  }

  addModule<T>(module: ModuleType<T>): CompiledModule<T>['token'] {
    const compiledModule = this.moduleCompiler.compile(module as any);

    if (compiledModule.metadata.imports && compiledModule.metadata.imports.length > 0) {
      for (const imported of compiledModule.metadata.imports) {
        this.addModule(imported);
      }
    }

    if (this.modules.has(compiledModule.token)) {
      return compiledModule.token;
    }

    const processedModule = this.processModuleMetadata(compiledModule.metadata);
    this.registerGlobalProviders(processedModule, compiledModule.token);

    this.modules.set(compiledModule.token, processedModule);
    this.registerProviderTokens(processedModule, compiledModule.token);

    return compiledModule.token;
  }

  private processModuleMetadata<T>(module: ModuleMetadata<T>): ModuleMetadata<T> {
    const controllerProviders = (module.controllers ?? []).map((controller) => ({
      provide: controller,
      useClass: controller,
    }));

    return {
      ...module,
      providers: [...(module.providers ?? []), ...controllerProviders],
    };
  }

  private registerGlobalProviders<T>(module: ModuleMetadata<T>, token: string): void {
    module.exports?.forEach((provider: any) => {
      const providerToken = this.getProviderToken(provider);
      this.globalProviders.set(providerToken, provider);
      this.providerTokenMap.set(providerToken, token);
    });
  }
  private getProviderToken<T>(provider: Provider<T>): InjectionToken<T> {
    return typeof provider === 'function' ? provider : provider.provide;
  }

  getModule<T>(token: string): ModuleMetadata<T> | undefined {
    return this.modules.get(token);
  }

  getProviderByToken<T>(token: InjectionToken<T>): Provider<T> | undefined {
    const moduleToken = this.providerTokenMap.get(token);
    return moduleToken ? this.findProviderInModule(token, moduleToken) : this.globalProviders.get(token) || this.findProviderInAllModules(token);
  }
  private registerProviderTokens<T>(module: ModuleMetadata<T>, token: string): void {
    module.providers?.forEach((provider) => {
      this.providerTokenMap.set(this.getProviderToken(provider), token);
    });
  }

  private findProviderInModule<T>(token: InjectionToken<T>, moduleToken: string): Provider<T> | undefined {
    const module = this.modules.get(moduleToken);
    return module?.providers?.find((p) => this.getProviderToken(p) === token);
  }

  private findProviderInAllModules<T>(token: InjectionToken<T>): Provider<T> | undefined {
    for (const [_, module] of this.modules) {
      const provider = module.providers?.find((p) => this.getProviderToken(p) === token);
      if (provider) return provider;
    }
  }
  clear() {
    this.modules.clear();
    this.globalProviders.clear();
    this.providerTokenMap.clear();
  }
}
