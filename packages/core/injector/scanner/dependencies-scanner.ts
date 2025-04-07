import { DynamicModule, ImportableModule, InjectionToken, isDynamicModule, MODULE_METADATA, ModuleMetadata } from '@glandjs/common';
import { Constructor } from '@medishn/toolkit';
import { Module } from '../module';
import { Container, type ModulesContainer } from '../container';
export class DependenciesScanner {
  private readonly container: Container;
  private readonly modulesContainer: ModulesContainer;
  constructor() {
    this.container = new Container();
    this.modulesContainer = this.container.modules;
  }
  get modules() {
    return this.container.modules;
  }

  public async scan(rootModule: Constructor | DynamicModule): Promise<void> {
    await this.scanForModules(rootModule);

    await this.scanModulesForDependencies();
  }

  private async scanForModules(rootModule: Constructor | DynamicModule): Promise<void> {
    const moduleRef = await this.container.register(rootModule);

    this.modulesContainer.set(moduleRef.token, moduleRef);
    for (const importedModule of moduleRef.imports) {
      if (!this.modulesContainer.has(importedModule.token)) {
        this.modulesContainer.set(importedModule.token, importedModule);
        await this.scanForModules(this.getModuleByToken(importedModule.token)!);
      }
    }
  }
  private getModuleType(moduleDefinition: ImportableModule): Constructor {
    return isDynamicModule(moduleDefinition) ? moduleDefinition.module : moduleDefinition;
  }
  private async scanModuleDependencies(moduleRef: Module): Promise<void> {
    const token = moduleRef.token;
    const moduleType = this.getModuleByToken(token);
    if (!moduleType) {
      throw new Error(`Could not find module type for token: ${token}`);
    }

    const metadata = this.extractModuleMetadata(moduleType);

    if (metadata.imports) {
      await this.scanModuleImports(metadata.imports, moduleRef);
    }

    if (metadata.controllers) {
      this.scanControllers(metadata.controllers, moduleRef);
    }

    if (metadata.channels) {
      this.scanChannels(metadata.channels, moduleRef);
    }

    if (metadata.exports) {
      this.scanExports(metadata.exports, moduleRef);
    }
  }
  private extractModuleMetadata(moduleType: Constructor): ModuleMetadata {
    return Reflect.getMetadata(MODULE_METADATA, moduleType) ?? {};
  }

  private getModuleToken(moduleDefinition: ImportableModule): string {
    const moduleType = this.getModuleType(moduleDefinition);
    return moduleType.name;
  }
  private getModuleByToken(token: InjectionToken): Constructor | undefined {
    const moduleRef = this.modulesContainer.getByToken(token as string);
    return moduleRef ? moduleRef.metatype : undefined;
  }

  private async scanModuleImports(imports: ImportableModule[], moduleRef: Module): Promise<void> {
    for (const importedModule of imports) {
      const token = this.getModuleToken(importedModule);
      const importedRef = this.modulesContainer.getByToken(token);
      if (importedRef) {
        moduleRef.addImports([importedRef]);
      }
    }
  }
  private scanControllers(controllers: Constructor[], moduleRef: Module): void {
    controllers.forEach((controller) => {
      moduleRef.addController(controller);
    });
  }

  private scanChannels(streams: Constructor[], moduleRef: Module): void {
    streams.forEach((stream) => {
      moduleRef.addChannel(stream);
    });
  }

  private scanExports(exports: InjectionToken[], moduleRef: Module): void {
    exports.forEach((token) => {
      moduleRef.addExport(token);
    });
  }

  private async scanModulesForDependencies(): Promise<void> {
    for (const [_, moduleRef] of this.modulesContainer.entries()) {
      await this.scanModuleDependencies(moduleRef);
    }
  }
}
