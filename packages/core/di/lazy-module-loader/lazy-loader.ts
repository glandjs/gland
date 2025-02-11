import { InjectionToken, ModuleMetadata, ModuleType } from '@gland/common';
import { Injector } from '../injector';
import { Container } from '../container';
import { CompiledModule, ModuleCompiler } from '../compiler';

export class LazyModuleLoader {
  private readonly loadedModules = new Map<string, ModuleMetadata<any>>();

  constructor(private readonly container: Container, private readonly injector: Injector, private readonly moduleCompiler: ModuleCompiler) {}
  async loadModule<T>(module: ModuleType<T>): Promise<CompiledModule<T>> {
    const compiledModule = this.moduleCompiler.compile(module as any);

    if (this.loadedModules.has(compiledModule.token)) {
      return {
        token: compiledModule.token,
        metadata: this.loadedModules.get(compiledModule.token)!,
      };
    }

    const moduleToken = this.container.addModule(module);
    const moduleMetadata = this.container.getModule<T>(moduleToken)!;

    this.loadedModules.set(moduleToken, moduleMetadata);

    await this.initializeProviders(moduleMetadata, moduleToken);

    return {
      token: moduleToken,
      metadata: moduleMetadata,
    };
  }
  private async initializeProviders<T>(module: ModuleMetadata<T>, moduleToken: string): Promise<void> {
    if (!module.providers || module.providers.length === 0) return;

    for (const provider of module.providers) {
      const providerToken = this.getProviderToken(provider);
      try {
        await this.injector.resolve(providerToken, moduleToken);
      } catch (error) {
        throw error;
      }
    }
  }
  private getProviderToken<T>(provider: any): InjectionToken<T> {
    return typeof provider === 'function' ? provider : provider.provide;
  }
}
