import { Constructor, Logger } from '@medishn/toolkit';
import { DynamicModule, ImportableModule, InjectionToken, isDynamicModule, MODULE_METADATA, ModuleMetadata } from '@glandjs/common';
import { Container, ModulesContainer } from '../container';
import type { Module } from '../module';

export class DependenciesScanner {
  private readonly container: Container;
  private logger?: Logger;
  constructor(logger?: Logger) {
    this.container = new Container(logger);
    this.logger = logger?.child('Scanner');
  }
  get modules(): ModulesContainer {
    return this.container.modules;
  }
  public async scan(rootModule: Constructor | DynamicModule): Promise<void> {
    this.logger?.debug('Starting full module scan');

    await this.scanForModules(rootModule);

    this.logger?.debug('Completed scanning module structure, scanning dependencies');

    await this.scanModulesForDependencies();

    this.logger?.debug('- Done.');
  }

  private async scanForModules(rootModule: Constructor | DynamicModule): Promise<void> {
    const moduleRef = await this.container.register(rootModule);
    this.logger?.debug(`Registered module: ${moduleRef.token}`);
    this.modules.set(moduleRef.token, moduleRef);

    for (const importedModule of moduleRef.imports) {
      if (!this.modules.has(importedModule.token)) {
        this.modules.set(importedModule.token, importedModule);

        const moduleType = this.getModuleByToken(importedModule.token);
        if (moduleType) {
          await this.scanForModules(moduleType);
        }
      }
    }
  }

  private async scanModulesForDependencies(): Promise<void> {
    for (const [_, moduleRef] of this.modules.entries()) {
      await this.scanModuleDependencies(moduleRef);
    }
  }
  private async scanModuleDependencies(moduleRef: Module): Promise<void> {
    const token = moduleRef.token;
    const moduleType = this.getModuleByToken(token);

    if (!moduleType) {
      throw new Error(`Could not find module type for token: ${token}`);
    }

    const metadata = this.extractModuleMetadata(moduleType);
    this.logger?.debug(`Scanning dependencies for module: ${token}`);

    // Process imports
    if (metadata.imports && metadata.imports.length > 0) {
      this.logger?.debug(` - Imports found: ${metadata.imports.length}`);
      await this.scanModuleImports(metadata.imports, moduleRef);
    }

    // Process controllers
    if (metadata.controllers && metadata.controllers.length > 0) {
      this.logger?.debug(` - Controllers found: ${metadata.controllers.map((c) => c.name).join(', ')}`);
      this.scanControllers(metadata.controllers, moduleRef);
    }

    // Process channels
    if (metadata.channels && metadata.channels.length > 0) {
      this.logger?.debug(` - Channels found: ${metadata.channels.map((c) => c.name).join(', ')}`);
      this.scanChannels(metadata.channels, moduleRef);
    }
  }

  private getModuleByToken(token: InjectionToken): Constructor | undefined {
    const moduleRef = this.modules.getByToken(token as string);
    return moduleRef ? moduleRef.metatype : undefined;
  }

  private extractModuleMetadata(moduleType: Constructor): ModuleMetadata {
    return (
      Reflect.getMetadata(MODULE_METADATA, moduleType) ?? {
        imports: [],
        controllers: [],
        channels: [],
      }
    );
  }

  private async getModuleType(moduleDefinition: ImportableModule): Promise<Constructor> {
    if (isDynamicModule(moduleDefinition)) {
      return moduleDefinition.module;
    }

    if (moduleDefinition instanceof Promise) {
      const resolvedModule = await moduleDefinition;
      return isDynamicModule(resolvedModule) ? resolvedModule.module : resolvedModule;
    }

    return moduleDefinition;
  }

  private async getModuleToken(moduleDefinition: ImportableModule): Promise<string> {
    const moduleType = await this.getModuleType(moduleDefinition);
    return moduleType.name;
  }

  private async scanModuleImports(imports: ImportableModule[], moduleRef: Module): Promise<void> {
    for (const importedModule of imports) {
      const token = await this.getModuleToken(importedModule);
      const importedRef = this.modules.getByToken(token);

      if (importedRef) {
        moduleRef.addImports([importedRef]);
      } else {
        this.logger?.warn(`Could not find imported module with token: ${token}`);
      }
    }
  }

  private scanControllers(controllers: Constructor[], moduleRef: Module): void {
    controllers.forEach((controller) => {
      const instance = this.container.resolve(controller);
      moduleRef.addController(controller, instance);
      this.logger?.debug(`Added controller: ${controller.name} to module: ${moduleRef.token}`);
    });
  }

  private scanChannels(channels: Constructor[], moduleRef: Module): void {
    channels.forEach((channel) => {
      const instance = this.container.resolve(channel);
      moduleRef.addChannel(channel, instance);
      this.logger?.debug(`Added channel: ${channel.name} to module: ${moduleRef.token}`);
    });
  }
}
