import { Logger } from '@medishn/toolkit';
import { ModulesContainer } from '../injector';
import { InstanceWrapper } from '../injector/instance-wrapper';
import type { Module } from '../injector/module';

export type LifecycleHook = 'onModuleInit' | 'onModuleDestroy' | 'onAppBootstrap' | 'onAppShutdown' | 'onChannelInit';

export type LifecycleComponentType = 'module' | 'controller' | 'channel';

export interface LifecycleComponent {
  instance: any;
  moduleToken: string;
  componentType: LifecycleComponentType;
  componentToken: string;
}

export class LifecycleScanner {
  private readonly moduleComponentMap = new Map<string, Set<LifecycleComponent>>();
  private readonly logger?: Logger;
  constructor(
    private readonly modulesContainer: ModulesContainer,
    logger?: Logger,
  ) {
    this.logger = logger?.child('LifecycleScanner');
  }

  public scanForHooks(): void {
    this.logger?.debug('Scanning for lifecycle hooks');

    for (const [moduleToken, module] of this.modulesContainer.entries()) {
      this.scanModule(moduleToken, module);
    }

    this.logger?.debug(`Found components with hooks in ${this.moduleComponentMap.size} modules`);
  }

  private scanModule(moduleToken: string, module: Module): void {
    const components = new Set<LifecycleComponent>();
    this.moduleComponentMap.set(moduleToken, components);

    if (module.metatype) {
      try {
        const moduleInstance = this.getModuleInstance(module);
        if (moduleInstance) {
          components.add({
            instance: moduleInstance,
            moduleToken,
            componentType: 'module',
            componentToken: moduleToken,
          });
          this.logger?.debug(`Module ${moduleToken} registered for lifecycle hooks`);
        }
      } catch (error) {
        this.logger?.error(`Error resolving module instance for ${moduleToken}: ${error.message}`);
      }
    }

    this.scanComponentsForHooks(moduleToken, module.controllers, 'controller', components);

    this.scanComponentsForHooks(moduleToken, module.channels, 'channel', components);
  }
  private scanComponentsForHooks(moduleToken: string, components: Map<any, InstanceWrapper>, componentType: LifecycleComponentType, lifecycleComponents: Set<LifecycleComponent>): void {
    for (const [token, wrapper] of components.entries()) {
      try {
        const instance = wrapper.getInstance();
        const componentToken = typeof token === 'function' ? token.name : String(token);
        const hasHooks = this.hasLifecycleHooks(instance);

        if (hasHooks) {
          lifecycleComponents.add({
            instance,
            moduleToken,
            componentType,
            componentToken,
          });
          this.logger?.debug(`${componentType} ${componentToken} registered for lifecycle hooks`);
        }
      } catch (error) {
        this.logger?.error(`Error resolving ${componentType} instance: ${error.message}`);
      }
    }
  }

  private getModuleInstance(module: Module): any {
    const token = module.metatype;
    return new module.metatype();
  }

  private hasLifecycleHooks(instance: any): boolean {
    return (
      this.hasHook(instance, 'onModuleInit') ||
      this.hasHook(instance, 'onModuleDestroy') ||
      this.hasHook(instance, 'onAppBootstrap') ||
      this.hasHook(instance, 'onAppShutdown') ||
      this.hasHook(instance, 'onChannelInit')
    );
  }

  private hasHook(instance: any, hook: LifecycleHook): boolean {
    return instance && typeof instance[hook] === 'function';
  }

  public async runHook(hook: LifecycleHook, signal?: string): Promise<void> {
    this.logger?.debug(`Running ${hook} hooks`);

    const promises: Promise<void>[] = [];

    for (const [moduleToken, components] of this.moduleComponentMap.entries()) {
      for (const component of components) {
        if (this.hasHook(component.instance, hook)) {
          this.logger?.debug(`Executing ${hook} on ${component.componentType} ${component.componentToken}`);

          try {
            let promise: Promise<void> | void;

            if (hook === 'onAppShutdown') {
              promise = component.instance[hook](signal);
            } else {
              promise = component.instance[hook]();
            }

            // Ensure the result is a Promise
            if (promise && typeof promise.then === 'function') {
              promises.push(promise);
            }
          } catch (error) {
            this.logger?.error(`Error running ${hook} on ${component.componentType} ${component.componentToken}: ${error.message}`);
          }
        }
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    this.logger?.debug(`Completed ${hook} hooks`);
  }

  public async onModuleInit(): Promise<void> {
    await this.runHook('onModuleInit');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.runHook('onModuleDestroy');
  }

  public async onAppBootstrap(): Promise<void> {
    await this.runHook('onAppBootstrap');
  }

  public async onAppShutdown(signal?: string): Promise<void> {
    await this.runHook('onAppShutdown', signal);
  }

  public async onChannelInit(): Promise<void> {
    await this.runHook('onChannelInit');
  }
}
