import { InjectionToken } from '@glandjs/common';
import { Constructor } from '@medishn/toolkit';
import { InstanceWrapper } from './instance-wrapper';

export class Module {
  public readonly imports = new Set<Module>();
  public readonly controllers = new Map<InjectionToken, InstanceWrapper<any>>();
  public readonly channels = new Map<InjectionToken, InstanceWrapper<any>>();
  constructor(
    public readonly token: string,
    public readonly metatype: Constructor,
  ) {}
  public addImports(imports: Module[]) {
    imports.forEach((imp) => this.imports.add(imp));
  }

  public addController(controller: Constructor, instance?: any): void {
    const wrapper = new InstanceWrapper(controller, instance);
    this.controllers.set(controller, wrapper);
  }

  public addChannel(channel: Constructor, instance?: any): void {
    const wrapper = new InstanceWrapper(channel, instance);

    this.channels.set(channel, wrapper);
  }
}
