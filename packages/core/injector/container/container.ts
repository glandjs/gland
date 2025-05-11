import { DynamicModule, ImportableModule, InjectionToken, isDynamicModule, MODULE_METADATA } from '@glandjs/common';
import { Module } from '../module';
import { DependencyGraph } from '../graph';
import { ModulesContainer } from './module-container';
import { Constructor, type Logger } from '@medishn/toolkit';

export class Container {
  private readonly _modules = new ModulesContainer();
  private readonly instances = new Map<InjectionToken, any>();
  private readonly graph = new DependencyGraph();
  private logger?: Logger;
  constructor(logger?: Logger) {
    this.logger = logger?.child('Container');
  }

  get modules(): ModulesContainer {
    return this._modules;
  }

  public async register(module: Constructor | DynamicModule, parentModuleId?: string): Promise<Module> {
    const { module: moduleClass, metadata } = this.normalizeModule(module);
    const moduleId = this.getId(moduleClass);

    const existingModule = this._modules.getByToken(moduleId);
    if (existingModule) {
      return existingModule;
    }
    this.logger?.debug(`Registering module: ${moduleId}`);
    const moduleRef = this.createModule(moduleId, moduleClass);
    this.graph.addNode(moduleId, 'module', parentModuleId, metadata);

    await this.processImports(moduleRef, metadata.imports || [], moduleId);

    this.processControllers(moduleRef, metadata.controllers || [], moduleId);
    this.processChannels(moduleRef, metadata.channels || [], moduleId);

    this.logger?.debug(`- Done.`);
    return moduleRef;
  }
  private normalizeModule(module: Constructor | DynamicModule) {
    if (isDynamicModule(module)) {
      return {
        module: module.module,
        metadata: {
          imports: module.imports || [],
          controllers: module.controllers || [],
          channels: module.channels || [],
        },
      };
    }
    return {
      module,
      metadata: Reflect.getMetadata(MODULE_METADATA, module) || {
        imports: [],
        controllers: [],
        channels: [],
      },
    };
  }
  private getId(token: InjectionToken): string {
    if (typeof token === 'string') return token;
    if (typeof token === 'symbol') return token.description || token.toString();
    return token.name;
  }
  private createModule(token: string, module: Constructor): Module {
    const moduleRef = new Module(token, module);
    this._modules.set(token, moduleRef);
    return moduleRef;
  }

  private async processImports(module: Module, imports: ImportableModule[], moduleId: string): Promise<void> {
    const importedModules: Module[] = [];

    for (const imported of imports) {
      const importedModule = await this.register(imported instanceof Promise ? await imported : imported, moduleId);
      importedModules.push(importedModule);
    }

    module.addImports(importedModules);
  }

  private processControllers(module: Module, controllers: Constructor[], moduleId: string): void {
    controllers.forEach((controller) => {
      const controllerId = this.getId(controller);
      this.graph.addNode(controllerId, 'controller', moduleId);

      const instance = this.resolve(controller);
      module.addController(controller, instance);

      const controllerNode = this.graph.getNode(controllerId);
      if (controllerNode) {
        controllerNode.instance = instance;
      }
      this.logger?.debug(`Registered controller: ${controllerId}`);
    });
  }

  private processChannels(module: Module, channels: Constructor[], moduleId: string): void {
    channels.forEach((channel) => {
      const channelId = this.getId(channel);
      this.graph.addNode(channelId, 'channel', moduleId);

      const instance = this.resolve(channel);
      module.addChannel(channel, instance);

      const node = this.graph.getNode(channelId);
      if (node) {
        node.instance = instance;
      }
      this.logger?.debug(`Registered channel: ${channelId}`);
    });
  }

  public resolve<T>(token: InjectionToken<T>): T {
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    const constructor = token as Constructor<T>;
    const paramTypes = Reflect.getMetadata('design:paramtypes', constructor) || [];

    const dependencies = paramTypes.map((param) => this.resolve(param));

    const instance = new constructor(...dependencies);
    this.instances.set(token, instance);
    this.logger?.debug(`Resolved instance: ${this.getId(token)}`);
    return instance;
  }
}
