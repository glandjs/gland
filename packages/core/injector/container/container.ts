import { DynamicModule, ImportableModule, InjectionToken, isDynamicModule, MODULE_METADATA } from '@glandjs/common';
import { Module } from '../module';
import { DeepHashedModule } from '../opaque-key-factory';
import { Constructor } from '@medishn/toolkit';
import { DependencyGraph } from '../graph';
import { ModulesContainer } from './module-container';
export interface ModuleFactory {
  type: Constructor<any>;
  token: string;
}

export class Container {
  private readonly _modules = new ModulesContainer();
  private readonly instances = new Map<InjectionToken, any>();
  private readonly graph = new DependencyGraph();
  constructor() {}
  get modules() {
    return this._modules;
  }
  public async compile(module: Constructor): Promise<ModuleFactory> {
    const moduleOpaqueKeyFactory = new DeepHashedModule();
    const token = moduleOpaqueKeyFactory.createForStatic(module);
    return { type: module, token };
  }
  public async register(module: Constructor | DynamicModule): Promise<Module> {
    const { module: moduleClass, metadata } = this.normalizeModule(module);
    const factory = await this.compile(moduleClass);
    const moduleRef = this.createModule(factory, moduleClass);
    const moduleId = this.getId(factory.token);
    this.graph.addNode(moduleId, 'module', metadata);
    await this.processImports(moduleRef, metadata.imports || [], moduleId);
    this.processControllers(moduleRef, metadata.controllers || [], moduleId);
    this.processChannels(moduleRef, metadata.channels || [], moduleId);
    this.processExports(moduleRef, metadata.exports || [], moduleId);
    return moduleRef;
  }

  private getId(token: InjectionToken): string {
    if (typeof token === 'string') return token;
    if (typeof token === 'symbol') return token.description || token.toString();
    if (typeof token === 'function') return token.name;
    throw new Error('Invalid injection token');
  }

  private normalizeModule(module: Constructor | DynamicModule) {
    if (isDynamicModule(module)) {
      return {
        module: module.module,
        metadata: {
          imports: module.imports,
          controllers: module.controllers,
          channels: module.channels,
          exports: module.exports,
        },
      };
    }
    return {
      module,
      metadata: Reflect.getMetadata(MODULE_METADATA, module),
    };
  }
  private createModule(factory: ModuleFactory, module: Constructor): Module {
    const moduleRef = new Module(factory.token, module);
    this.modules.set(factory.token, moduleRef);
    return moduleRef;
  }

  private async processImports(module: Module, imports: ImportableModule[], moduleId: string): Promise<void> {
    for (const imported of imports) {
      const importedModule = await this.register(imported);
      module.addImports([importedModule]);
    }
  }

  private processControllers(module: Module, controllers: Constructor[], moduleId: string): void {
    controllers.forEach((controller) => {
      const controllerId = this.getId(controller);
      this.graph.addNode(controllerId, 'controller');

      const instance = this.resolve(controller);
      module.addController(controller);

      this.instances.set(controller, instance);
      const controllerNode = this.graph.getNode(controllerId);
      if (controllerNode) {
        controllerNode.instance = instance;
      }
    });
  }

  private processChannels(module: Module, channels: Constructor[], moduleId: string): void {
    channels.forEach((channel) => {
      const channelId = this.getId(channel);
      this.graph.addNode(channelId, 'channel');
      const instance = this.resolve(channel);
      module.addChannel(channel);

      this.instances.set(channel, instance);
      const channelNode = this.graph.getNode(channelId);
      if (channelNode) {
        channelNode.instance = instance;
      }
    });
  }

  private processExports(module: Module, exports: InjectionToken[], moduleId: string): void {
    exports.forEach((token) => {
      const tokenId = this.getId(token);

      let tokenExists = false;

      if (this.instances.has(token)) {
        tokenExists = true;
      } else if (module.controllers.has(token)) {
        tokenExists = true;
      } else if (module.channels.has(token)) {
        tokenExists = true;
      }

      if (!tokenExists) {
        throw new Error(`Exported token ${tokenId} not found in module ${moduleId}`);
      }

      const node = this.graph.getNode(tokenId);
      if (node) {
        node.metadata = node.metadata || {};
        node.metadata.exported = true;
      }
      module.addExport(token);
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

    const tokenId = this.getId(token);
    const node = this.graph.getNode(tokenId);
    if (node) {
      node.instance = instance;
    }

    return instance;
  }
}
